# Visitor Map Worker

This worker turns the homepage visitor map into a live service:

- every homepage visit calls `/api/visit`
- total visits increase in real time
- the recent visitor list keeps the latest 5 entries
- only city/country/time are stored for recent visits
- no raw IP address is stored in KV

## Architecture

Frontend:

- homepage card in `_pages/about.md`
- browser script in `assets/js/visitor-map.js`

Backend:

- Cloudflare Worker in `worker/src/index.js`
- Cloudflare KV namespace bound as `VISITOR_STATS`

## Setup

1. Create a KV namespace in Cloudflare.
2. Put the namespace id into `worker/wrangler.toml`:

```toml
kv_namespaces = [
  { binding = "VISITOR_STATS", id = "YOUR_KV_NAMESPACE_ID" }
]
```

3. Install Wrangler if needed:

```bash
npm install -g wrangler
```

4. Login and deploy:

```bash
cd worker
wrangler login
wrangler deploy
```

5. Copy the deployed Worker endpoint, for example:

```text
https://linpeiran-visitor-map.<subdomain>.workers.dev/api/visit
```

6. Put that URL into `_config.yml`:

```yml
visitor_map:
  endpoint: "https://linpeiran-visitor-map.<subdomain>.workers.dev/api/visit"
```

7. Rebuild/redeploy the GitHub Pages site.

## Local behavior before deployment

If `visitor_map.endpoint` is empty, the homepage will fall back to:

- `assets/data/visitor-map.json`

That means the page still renders locally even before the Worker is online.

## Notes

- The Worker counts one visit each time the homepage script successfully calls the endpoint.
- If you later want to reduce repeated refresh counting, we can add a short cookie-based cooldown.
- If you want a custom domain instead of `workers.dev`, we can bind one later.
