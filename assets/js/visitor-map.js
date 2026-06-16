(function () {
  const root = document.getElementById("visitor-analytics");
  if (!root) return;

  const source = root.getAttribute("data-source");
  const pointsRoot = document.getElementById("visitor-map-points");
  const visitsEl = document.getElementById("visitor-total-visits");
  const countriesEl = document.getElementById("visitor-total-countries");
  const citiesEl = document.getElementById("visitor-total-cities");
  const countryList = document.getElementById("visitor-country-ranking");
  const cityList = document.getElementById("visitor-city-ranking");

  function projectPoint(lat, lon) {
    const x = ((lon + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(value || 0);
  }

  function renderRanking(listEl, rows, formatter) {
    listEl.innerHTML = "";
    rows.forEach(function (row) {
      const item = document.createElement("li");
      const label = document.createElement("span");
      const value = document.createElement("strong");
      label.textContent = formatter(row);
      value.textContent = formatNumber(row.visits);
      item.appendChild(label);
      item.appendChild(value);
      listEl.appendChild(item);
    });
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
      const size = 10 + Math.round((entry.visits / maxVisits) * 12);
      const delay = (index % 9) * 0.28;

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

  function render(data) {
    visitsEl.textContent = formatNumber(data.totals && data.totals.visits);
    countriesEl.textContent = formatNumber(data.totals && data.totals.countries);
    citiesEl.textContent = formatNumber(data.totals && data.totals.cities);

    renderPoints(data.locations || []);
    renderRanking(countryList, data.countries || [], function (row) {
      return row.name;
    });
    renderRanking(cityList, data.cities || [], function (row) {
      return row.name + ", " + row.country;
    });
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
