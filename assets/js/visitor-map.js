(function () {
  const root = document.getElementById("visitor-analytics");
  if (!root) return;

  const source = root.getAttribute("data-source");
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
    const maxVisits = Math.max.apply(null, locations.map(function (entry) {
      return entry.visits;
    }));

    locations.forEach(function (entry, index) {
      const point = projectPoint(entry.lat, entry.lon);
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
      meta.textContent = row.ip_masked + " · " + row.time;
      place.textContent = row.city + ", " + row.country;
      item.appendChild(meta);
      item.appendChild(place);
      recentList.appendChild(item);
    });
  }

  function render(data) {
    visitsEl.textContent = formatNumber(data.totals && data.totals.visits);
    renderPoints(data.locations || []);
    renderRecent(data.recent_visits || []);
  }

  fetch(source)
    .then(function (response) {
      if (!response.ok) throw new Error("Failed to load visitor map data");
      return response.json();
    })
    .then(render)
    .catch(function () {
      root.classList.add("visitor-analytics--error");
    });
})();
