# Weatherline

A modern, real-time weather dashboard. Search any city and get current
conditions, an hourly outlook, and a 5-day forecast — with a background that
shifts to match the sky.

## Features

- 🔍 Search weather by city name
- 📍 "Use current location" via browser geolocation
- 🌡️ Current temperature, condition, and "feels like"
- 💧 Humidity, 💨 wind speed, 👁️ visibility, and 🌡️ pressure
- 🌅 Sunrise / sunset times
- ⏱️ Hourly forecast (3-hour steps, next 24h)
- 📅 5-day forecast with daily high/low
- 🔁 Celsius / Fahrenheit toggle
- ⏳ Loading state and a clear error message for unknown cities
- 📱 Fully responsive, glassmorphism UI with a background that changes per
  weather condition (clear, cloudy, rain, storm, snow, mist — day and night)

## Technologies used

- HTML5
- CSS3 (custom properties, backdrop-filter glassmorphism, CSS grid/flexbox)
- Vanilla JavaScript (no framework, no build step)
- [OpenWeatherMap API](https://openweathermap.org/api) — Geocoding, Current
  Weather, and 5 Day / 3 Hour Forecast endpoints (all on the free tier)
- Google Fonts: Space Grotesk + Inter

## Screenshots

_Add screenshots here once you've run the app, e.g.:_

```
screenshots/
├── desktop-clear.png
├── desktop-rain.png
└── mobile-view.png
```

## Project structure

```
weather-app/
│
├── index.html          # Markup and layout
├── style.css            # All styling, incl. the weather-based backgrounds
├── script.js             # Fetch logic, rendering, and event handling
├── config.example.js      # Template for your local API key file
├── config.js               # ← you create this locally; never committed
├── .env.example              # Reference only — see "About the API key" below
├── .gitignore
└── README.md
```

## API setup

1. Create a free account at <https://openweathermap.org/api>.
2. Go to **My API keys** and copy your default key.
3. New keys can take **10 minutes to a couple of hours** to activate — if you
   get a 401 error at first, wait and try again.

### About the API key (important)

This is a plain static site (no server, no bundler), so there is no real
`process.env` for the browser to read at runtime. To keep the key out of
git while still keeping the project beginner-friendly:

1. Copy `config.example.js` to a new file named `config.js`.
2. Open `config.js` and paste in your real key:
   ```js
   window.WEATHER_API_KEY = "paste_your_real_key_here";
   ```
3. `config.js` is already listed in `.gitignore`, so it will never be pushed
   to GitHub.

`.env.example` is included for reference and for a future backend version —
see **Future improvements** below. A `.env` file cannot be read directly by
plain browser JavaScript.

**Note:** any key placed in frontend JavaScript is technically visible to
anyone who opens your browser's dev tools, since the request is made
client-side. This is normal and expected for a client-only weather app —
it is *not* committed to your repository, which is the security goal here.
For a deployment where the key must be fully hidden from users too, route
requests through a small backend (see Future improvements).

## Installation instructions

```bash
# 1. Clone or download the project
git clone https://github.com/your-username/weather-app.git
cd weather-app

# 2. Create your local config file
cp config.example.js config.js
# then edit config.js and paste in your API key
```

No `npm install` is needed — there are no dependencies to install.

## How to run

Because the app uses `fetch()`, open it through a local server rather than
double-clicking the HTML file (some browsers block API requests from
`file://` pages).

**Option A — VS Code:** install the "Live Server" extension, right-click
`index.html`, and choose **Open with Live Server**.

**Option B — Python (built into most systems):**
```bash
python3 -m http.server 8000
```
Then open <http://localhost:8000> in your browser.

**Option C — Node.js:**
```bash
npx serve .
```

## Example usage

1. Open the app.
2. Type **Chennai** in the search bar and press enter, or tap the search
   icon.
3. You should see current conditions for Chennai, an hourly strip, and a
   5-day outlook.
4. Try **Bangalore** and **Mumbai** the same way to confirm the search,
   icons, and background all update correctly.
5. Tap the location icon to test geolocation (your browser will ask for
   permission).
6. Tap **°C / °F** to toggle units — the dashboard reloads in the new unit.

## Future improvements (Version 2)

- Add a tiny backend (e.g. a single serverless function) that holds the API
  key as a true server-side environment variable, so the browser never sees
  it at all.
- Switch the forecast source to OpenWeatherMap's One Call 3.0 API for a full
  7-day and true hour-by-hour forecast (requires enabling that plan on your
  OpenWeatherMap account).
- Add a "recent searches" list and city autocomplete.
- Add unit-aware wind direction and a UV index card.
- Cache the last successful search in local storage so the app has
  something to show offline.
- Add automated tests for the fetch/render logic.
