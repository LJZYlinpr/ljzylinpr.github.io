(() => {
  const root = document.querySelector("[data-endpoint]");
  if (!root || !root.dataset.endpoint) return;
  const set = (id, value) => {
    document.getElementById(id).textContent = value;
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const privateVisit =
    navigator.doNotTrack === "1" || navigator.globalPrivacyControl === true;
  set("visitor-state", "Connecting…");
  fetch(`${root.dataset.endpoint.replace(/\/$/, "")}/api/visit`, {
    method: "POST",
    credentials: "omit",
    signal: controller.signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ optOut: privateVisit }),
  })
    .then(async (response) => {
      if (!response.ok) throw new Error("Service unavailable");
      const data = await response.json();
      for (const key of ["views", "unique", "countries"]) {
        if (!Number.isSafeInteger(data[key]) || data[key] < 0)
          throw new Error("Invalid statistics");
      }
      set("visitor-total", data.views.toLocaleString());
      set("visitor-unique", data.unique.toLocaleString());
      set("visitor-countries", data.countries.toLocaleString());
      set(
        "visitor-location",
        [data.visitor.city, data.visitor.country].filter(Boolean).join(", ") ||
          "Location unavailable",
      );
      set("visitor-ip", data.visitor.ip || "IP unavailable");
      set("visitor-state", "Connected");
      set(
        "visitor-message",
        privateVisit
          ? "Your privacy preference is respected. This visit was not counted."
          : "Network-based estimates · your full IP is visible only to you.",
      );
      const regions = document.getElementById("visitor-regions");
      for (const item of data.regions || []) {
        const row = document.createElement("div");
        row.className = "region-row";
        const name = document.createElement("span");
        try {
          name.textContent = new Intl.DisplayNames(["en"], {
            type: "region",
          }).of(item.country);
        } catch {
          name.textContent = item.country;
        }
        const bar = document.createElement("meter");
        bar.min = 0;
        bar.max = Math.max(data.unique, 1);
        bar.value = item.count;
        bar.setAttribute(
          "aria-label",
          `${name.textContent}: ${item.count} visitors`,
        );
        const count = document.createElement("span");
        count.textContent = item.count.toLocaleString();
        row.append(name, bar, count);
        regions.append(row);
      }
    })
    .catch(() => {
      set("visitor-state", "Temporarily unavailable");
      set(
        "visitor-message",
        "Visitor insights could not be loaded. Please try again later.",
      );
    })
    .finally(() => clearTimeout(timeout));
})();
