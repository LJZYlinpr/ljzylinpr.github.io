const DEFAULT_STATE = {
  updated_at: null,
  totals: {
    visits: 0,
    countries: 0,
    cities: 0
  },
  locations: [],
  recent_visits: []
};

function buildCorsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}

function jsonResponse(body, env, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      ...buildCorsHeaders(env)
    }
  });
}

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

async function loadState(env) {
  const raw = await env.VISITOR_STATS.get(env.STATE_KEY, "json");
  return raw || cloneDefaultState();
}

function nowString() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function normalizeGeo(request) {
  const cf = request.cf || {};
  const city = (cf.city || "Unknown city").trim();
  const country = (cf.country || "Unknown country").trim();
  const latitude = Number(cf.latitude || 0);
  const longitude = Number(cf.longitude || 0);

  return {
    city,
    country,
    lat: Number.isFinite(latitude) ? latitude : 0,
    lon: Number.isFinite(longitude) ? longitude : 0
  };
}

function upsertLocation(state, visit, env) {
  const maxLocationBuckets = Number(env.MAX_LOCATION_BUCKETS || 60);
  const match = state.locations.find(function (entry) {
    return entry.name === visit.city && entry.country === visit.country;
  });

  if (match) {
    match.visits += 1;
    if (visit.lat) match.lat = visit.lat;
    if (visit.lon) match.lon = visit.lon;
  } else {
    state.locations.push({
      name: visit.city,
      country: visit.country,
      lat: visit.lat,
      lon: visit.lon,
      visits: 1
    });
  }

  state.locations.sort(function (a, b) {
    return b.visits - a.visits;
  });
  state.locations = state.locations.slice(0, maxLocationBuckets);
}

function updateRecentVisits(state, visit, env) {
  const maxRecentVisits = Number(env.MAX_RECENT_VISITS || 5);
  state.recent_visits.unshift({
    city: visit.city,
    country: visit.country,
    time: nowString()
  });
  state.recent_visits = state.recent_visits.slice(0, maxRecentVisits);
}

function refreshTotals(state) {
  const countries = new Set();
  const cities = new Set();

  state.locations.forEach(function (entry) {
    countries.add(entry.country);
    cities.add(entry.name + "::" + entry.country);
  });

  state.totals.countries = countries.size;
  state.totals.cities = cities.size;
}

function recordVisit(state, visit, env) {
  state.totals.visits += 1;
  upsertLocation(state, visit, env);
  updateRecentVisits(state, visit, env);
  refreshTotals(state);
  state.updated_at = nowString();
  return state;
}

async function handleVisit(request, env) {
  const visit = normalizeGeo(request);
  const state = await loadState(env);
  const nextState = recordVisit(state, visit, env);
  await env.VISITOR_STATS.put(env.STATE_KEY, JSON.stringify(nextState));
  return jsonResponse(nextState, env);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = buildCorsHeaders(env);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (url.pathname !== "/api/visit") {
      return jsonResponse({ error: "Not found" }, env, 404);
    }

    if (request.method !== "POST" && request.method !== "GET") {
      return jsonResponse({ error: "Method not allowed" }, env, 405);
    }

    try {
      return await handleVisit(request, env);
    } catch (error) {
      return jsonResponse(
        {
          error: "Visitor tracking failed",
          detail: error instanceof Error ? error.message : String(error)
        },
        env,
        500
      );
    }
  }
};
