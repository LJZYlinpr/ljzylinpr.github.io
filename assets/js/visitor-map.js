(function () {
  const root = document.getElementById("visitor-analytics");
  if (!root) return;

  const source = root.getAttribute("data-source");
  const endpoint = (root.getAttribute("data-endpoint") || "").trim();
  const pointsRoot = document.getElementById("visitor-map-points");
  const visitsEl = document.getElementById("visitor-total-visits");
  const recentList = document.getElementById("visitor-recent-list");

  function projectPoint(lat, lon) {
    const x = ((lon + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(value || 0);
  }

  function renderPoints(locations) {
    pointsRoot.innerHTML = "";
    if (!locations.length) return;

    const maxVisits = Math.max.apply(null, locations.map(function (entry) {
      return entry.visits;
    }));

    locations.forEach(function (entry, index) {
      const point = projectPoint(Number(entry.lat), Number(entry.lon));
      const dot = document.createElement("span");
      const pulse = document.createElement("span");
      const size = 7 + Math.round((entry.visits / maxVisits) * 7);
      const delay = (index % 9) * 0.24;

      dot.className = "visitor-point";
      dot.style.left = point.x + "%";
      dot.style.top = point.y + "%";
      dot.style.width = size + "px";
      dot.style.height = size + "px";
      dot.style.setProperty("--pulse-delay", delay + "s");
      dot.setAttribute("title", entry.name + ", " + entry.country + " · " + formatNumber(entry.visits) + " visits");

      pulse.className = "visitor-point__pulse";
      dot.appendChild(pulse);
      pointsRoot.appendChild(dot);
    });
  }

  function renderRecent(rows) {
    recentList.innerHTML = "";
    rows.slice(0, 5).forEach(function (row) {
      const item = document.createElement("li");
      const meta = document.createElement("span");
      const place = document.createElement("strong");
      meta.textContent = (row.time || "").trim();
      place.textContent = [row.city, row.country].filter(Boolean).join(", ");
      item.appendChild(meta);
      item.appendChild(place);
      recentList.appendChild(item);
    });
  }

  function render(data) {
    visitsEl.textContent = formatNumber(data.totals && data.totals.visits);
    renderPoints(data.locations || []);
    renderRecent(data.recent_visits || []);
    root.classList.remove("visitor-analytics--error");
  }

  function fetchJson(url, options) {
    return fetch(url, options).then(function (response) {
      if (!response.ok) throw new Error("Failed to load visitor data");
      return response.json();
    });
  }

  function fetchLiveData() {
    if (!endpoint) return Promise.reject(new Error("Visitor endpoint not configured"));

    return fetchJson(endpoint, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        page: window.location.pathname,
        title: document.title
      })
    });
  }

  function fetchFallbackData() {
    return fetchJson(source, {
      method: "GET",
      cache: "no-store"
    });
  }

  fetchLiveData()
    .catch(function () {
      root.classList.add("visitor-analytics--fallback");
      return fetchFallbackData();
    })
    .then(render)
    .catch(function () {
      root.classList.add("visitor-analytics--error");
    });
})();
