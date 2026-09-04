/* ==========================================================================
   Weatherline — app logic
   Uses the OpenWeatherMap Geocoding, Current Weather and 5-day/3-hour
   Forecast endpoints (all included in the free API tier — no paid
   subscription needed).
   ========================================================================== */

// The API key is read from config.js (see config.example.js). config.js is
// git-ignored, so your real key never gets committed.
const API_KEY = window.WEATHER_API_KEY || "";

const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

// ---------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------
const els = {
  bgLayer: document.getElementById("bgLayer"),
  searchForm: document.getElementById("searchForm"),
  cityInput: document.getElementById("cityInput"),
  locateBtn: document.getElementById("locateBtn"),
  unitToggle: document.getElementById("unitToggle"),

  loadingState: document.getElementById("loadingState"),
  loadingCity: document.getElementById("loadingCity"),
  errorState: document.getElementById("errorState"),
  errorMessage: document.getElementById("errorMessage"),
  emptyState: document.getElementById("emptyState"),
  dashboard: document.getElementById("dashboard"),

  placeName: document.getElementById("placeName"),
  placeDate: document.getElementById("placeDate"),
  conditionIcon: document.getElementById("conditionIcon"),
  tempValue: document.getElementById("tempValue"),
  tempUnit: document.getElementById("tempUnit"),
  conditionLabel: document.getElementById("conditionLabel"),
  feelsLike: document.getElementById("feelsLike"),
  sunrise: document.getElementById("sunrise"),
  sunset: document.getElementById("sunset"),

  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind"),
  visibility: document.getElementById("visibility"),
  pressure: document.getElementById("pressure"),

  hourlyRow: document.getElementById("hourlyRow"),
  dailyList: document.getElementById("dailyList"),
};

// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------
let unit = "metric"; // "metric" = °C, "imperial" = °F
let lastCoords = null; // { lat, lon, name, country } of the last successful lookup

// ---------------------------------------------------------------------
// Weather icon + background condition mapping
// OpenWeatherMap condition codes: https://openweathermap.org/weather-conditions
// ---------------------------------------------------------------------
function mapCondition(owmMain, icon) {
  const isNight = icon.endsWith("n");
  switch (owmMain) {
    case "Clear":
      return { emoji: isNight ? "🌙" : "☀️", bg: isNight ? "clear-night" : "clear-day" };
    case "Clouds":
      return { emoji: "⛅", bg: "clouds" };
    case "Rain":
    case "Drizzle":
      return { emoji: "🌧️", bg: "rain" };
    case "Thunderstorm":
      return { emoji: "⛈️", bg: "thunder" };
    case "Snow":
      return { emoji: "❄️", bg: "snow" };
    case "Mist":
    case "Fog":
    case "Haze":
    case "Smoke":
    case "Dust":
    case "Sand":
      return { emoji: "🌫️", bg: "mist" };
    default:
      return { emoji: "🌤️", bg: "clear-day" };
  }
}

// ---------------------------------------------------------------------
// UI state helpers
// ---------------------------------------------------------------------
function showState(state) {
  els.loadingState.hidden = state !== "loading";
  els.errorState.hidden = state !== "error";
  els.emptyState.hidden = state !== "empty";
  els.dashboard.hidden = state !== "dashboard";
}

function showError(message) {
  els.errorMessage.textContent = message;
  showState("error");
}

// ---------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.message || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function geocodeCity(city) {
  const url = `${GEO_URL}?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
  const results = await fetchJSON(url);
  if (!results.length) {
    const err = new Error("City not found");
    err.status = 404;
    throw err;
  }
  return results[0];
}

async function getWeatherByCoords(lat, lon) {
  const currentUrl = `${CURRENT_URL}?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`;
  const forecastUrl = `${FORECAST_URL}?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`;
  const [current, forecast] = await Promise.all([fetchJSON(currentUrl), fetchJSON(forecastUrl)]);
  return { current, forecast };
}

// ---------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------
function formatTime(unixSeconds, timezoneOffsetSeconds) {
  const date = new Date((unixSeconds + timezoneOffsetSeconds) * 1000);
  let hours = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${suffix}`;
}

function formatDay(unixSeconds, timezoneOffsetSeconds) {
  const date = new Date((unixSeconds + timezoneOffsetSeconds) * 1000);
  return date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

function renderCurrent(current) {
  const { name, sys, main, weather, wind, visibility: vis, dt, timezone } = current;
  const cond = mapCondition(weather[0].main, weather[0].icon);

  els.bgLayer.dataset.condition = cond.bg;
  els.placeName.textContent = `${name}, ${sys.country}`;
  els.placeDate.textContent = new Date((dt + timezone) * 1000).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  els.conditionIcon.textContent = cond.emoji;
  els.tempValue.textContent = Math.round(main.temp);
  els.tempUnit.textContent = unit === "metric" ? "°C" : "°F";
  els.conditionLabel.textContent = weather[0].description.replace(/\b\w/g, (c) => c.toUpperCase());
  els.feelsLike.innerHTML = `Feels like <span>${Math.round(main.feels_like)}°</span>`;
  els.sunrise.textContent = formatTime(sys.sunrise, timezone);
  els.sunset.textContent = formatTime(sys.sunset, timezone);

  els.humidity.textContent = `${main.humidity}%`;
  els.wind.textContent = `${Math.round(wind.speed)} ${unit === "metric" ? "km/h" : "mph"}`;
  els.visibility.textContent = `${(vis / 1000).toFixed(1)} km`;
  els.pressure.textContent = `${main.pressure} hPa`;

  document.title = `${Math.round(main.temp)}° in ${name} — Weatherline`;
}

function renderHourly(forecast) {
  const { list, city } = forecast;
  els.hourlyRow.innerHTML = "";
  list.slice(0, 8).forEach((entry) => {
    const cond = mapCondition(entry.weather[0].main, entry.weather[0].icon);
    const time = formatTime(entry.dt, city.timezone);
    const el = document.createElement("div");
    el.className = "hour-item";
    el.innerHTML = `
      <span class="h-time">${time}</span>
      <span class="h-icon">${cond.emoji}</span>
      <span class="h-temp">${Math.round(entry.main.temp)}°</span>
    `;
    els.hourlyRow.appendChild(el);
  });
}

function renderDaily(forecast) {
  const { list, city } = forecast;

  // Group the 3-hour entries by calendar day (in the location's own timezone)
  const byDay = new Map();
  list.forEach((entry) => {
    const dayKey = formatDay(entry.dt, city.timezone) + "-" + Math.floor((entry.dt + city.timezone) / 86400);
    if (!byDay.has(dayKey)) byDay.set(dayKey, []);
    byDay.get(dayKey).push(entry);
  });

  els.dailyList.innerHTML = "";
  [...byDay.entries()].slice(0, 5).forEach(([, entries]) => {
    const temps = entries.map((e) => e.main.temp);
    const hi = Math.round(Math.max(...temps));
    const lo = Math.round(Math.min(...temps));

    // Prefer the midday entry for a representative icon
    const midday =
      entries.find((e) => new Date((e.dt + city.timezone) * 1000).getUTCHours() === 12) || entries[Math.floor(entries.length / 2)];
    const cond = mapCondition(midday.weather[0].main, midday.weather[0].icon);
    const dayName = formatDay(midday.dt, city.timezone);

    const row = document.createElement("div");
    row.className = "day-row";
    row.innerHTML = `
      <span class="day-name">${dayName}</span>
      <span class="day-icon">${cond.emoji}</span>
      <span class="day-range"><span class="hi">${hi}°</span> / ${lo}°</span>
    `;
    els.dailyList.appendChild(row);
  });
}

// ---------------------------------------------------------------------
// Main lookup flow
// ---------------------------------------------------------------------
async function loadWeatherForCity(cityQuery) {
  if (!API_KEY) {
    showError("No API key configured yet — add one to config.js. See the README.");
    return;
  }

  els.loadingCity.textContent = cityQuery;
  showState("loading");

  try {
    const place = await geocodeCity(cityQuery);
    await loadWeatherForCoords(place.lat, place.lon, place.name, place.country);
  } catch (err) {
    handleFetchError(err);
  }
}

async function loadWeatherForCoords(lat, lon, fallbackName, fallbackCountry) {
  showState("loading");
  try {
    lastCoords = { lat, lon, name: fallbackName, country: fallbackCountry };
    const { current, forecast } = await getWeatherByCoords(lat, lon);
    renderCurrent(current);
    renderHourly(forecast);
    renderDaily(forecast);
    showState("dashboard");
  } catch (err) {
    handleFetchError(err);
  }
}

function handleFetchError(err) {
  if (err.status === 401) {
    showError("That API key was rejected. Double-check it in config.js — new keys can take a few minutes to activate.");
  } else if (err.status === 404) {
    showError("We couldn't find that city. Check the spelling and try again.");
  } else {
    showError("Something went wrong reaching the weather service. Please try again.");
  }
}

// ---------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------
els.searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = els.cityInput.value.trim();
  if (city) loadWeatherForCity(city);
});

els.locateBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showError("Geolocation isn't supported in this browser.");
    return;
  }
  els.loadingCity.textContent = "your location";
  showState("loading");
  navigator.geolocation.getCurrentPosition(
    (pos) => loadWeatherForCoords(pos.coords.latitude, pos.coords.longitude, "Your location", ""),
    () => showError("Location access was denied. Try searching for a city instead.")
  );
});

els.unitToggle.addEventListener("click", () => {
  unit = unit === "metric" ? "imperial" : "metric";
  els.unitToggle.querySelector(".unit-c").classList.toggle("active", unit === "metric");
  els.unitToggle.querySelector(".unit-f").classList.toggle("active", unit === "imperial");
  if (lastCoords) loadWeatherForCoords(lastCoords.lat, lastCoords.lon, lastCoords.name, lastCoords.country);
});

// ---------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------
showState("empty");
