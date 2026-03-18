const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherDisplay = document.getElementById('weather-display');
const emptyState = document.getElementById('empty-state');
const errorState = document.getElementById('error-state');
const loader = document.getElementById('loader');

// Elements to update
const cityNameEl = document.getElementById('city-name');
const dateEl = document.getElementById('current-date');
const tempEl = document.getElementById('temperature');
const descEl = document.getElementById('weather-description');
const iconEl = document.getElementById('weather-icon');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind-speed');
const feelsLikeEl = document.getElementById('feels-like');
const timezoneEl = document.getElementById('timezone');

// Map Initialization
let map;
let marker;

function initMap() {
    if (typeof L === 'undefined') return;
    map = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView([51.505, -0.09], 10);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 500);
}

const WMO_MAP = {
    0: { desc: "Clear Sky", icon: "☀️" },
    1: { desc: "Mainly Clear", icon: "🌤️" },
    2: { desc: "Partly Cloudy", icon: "⛅" },
    3: { desc: "Overcast", icon: "☁️" },
    45: { desc: "Fog", icon: "🌫️" },
    48: { desc: "Depositing Rime Fog", icon: "🌫️" },
    51: { desc: "Light Drizzle", icon: "🌦️" },
    53: { desc: "Moderate Drizzle", icon: "🌦️" },
    55: { desc: "Dense Drizzle", icon: "🌦️" },
    61: { desc: "Slight Rain", icon: "🌧️" },
    63: { desc: "Moderate Rain", icon: "🌧️" },
    65: { desc: "Heavy Rain", icon: "⛈️" },
    71: { desc: "Slight Snow", icon: "🌨️" },
    73: { desc: "Moderate Snow", icon: "🌨️" },
    75: { desc: "Heavy Snow", icon: "❄️" },
    95: { desc: "Thunderstorm", icon: "⚡" },
};

async function getCoordinates(city) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'SkyCastWeatherApp/1.0'
        }
    });

    if (!response.ok) throw new Error('Search failed');
    const data = await response.json();
    if (data.length === 0) return null;
    return {
        lat: data[0].lat,
        lon: data[0].lon,
        name: data[0].display_name.split(',')[0]
    };
}

async function getWeatherData(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather fetch failed');
    return await response.json();
}

function updateUI(weather, location) {
    const current = weather.current;
    const wmo = WMO_MAP[current.weather_code] || { desc: "Unknown", icon: "❓" };

    cityNameEl.textContent = location.name;
    dateEl.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    tempEl.textContent = Math.round(current.temperature_2m);
    descEl.textContent = wmo.desc;

    // Instead of a real icon URL (which can be flaky without a key), 
    // we use a large high-quality emoji as a placeholder or a font-based icon.
    // However, for a "premium" feel, let's use a nice SVG icon based on condition.
    // For this simple app, we'll use a dynamic character and some CSS glow.
    iconEl.alt = wmo.desc;
    iconEl.parentElement.innerHTML = `<span style="font-size: 80px; filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.4))">${wmo.icon}</span>`;

    humidityEl.textContent = `${current.relative_humidity_2m}%`;
    windEl.textContent = `${current.wind_speed_10m} km/h`;
    feelsLikeEl.textContent = `${Math.round(current.apparent_temperature)}°C`;
    timezoneEl.textContent = weather.timezone_abbreviation;

    // Update Map
    const lat = location.lat;
    const lon = location.lon;

    map.flyTo([lat, lon], 12, {
        animate: true,
        duration: 1.5
    });

    const weatherIcon = L.divIcon({
        html: `<div style="font-size: 40px; text-shadow: 0 0 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; width: 50px; height: 50px;">${wmo.icon}</div>`,
        className: 'custom-weather-icon',
        iconSize: [50, 50],
        iconAnchor: [25, 25]
    });

    if (marker) {
        marker.setLatLng([lat, lon]);
        marker.setIcon(weatherIcon);
    } else {
        marker = L.marker([lat, lon], { icon: weatherIcon }).addTo(map);
    }

    weatherDisplay.classList.remove('hidden');
    emptyState.classList.add('hidden');
    errorState.classList.add('hidden');
}

async function handleSearch() {
    const city = cityInput.value.trim();
    if (!city) return;

    // UI Feedback
    loader.classList.remove('hidden');
    weatherDisplay.classList.add('hidden');
    emptyState.classList.add('hidden');
    errorState.classList.add('hidden');

    try {
        const coords = await getCoordinates(city);
        if (!coords) {
            errorState.classList.remove('hidden');
            loader.classList.add('hidden');
            return;
        }

        const weather = await getWeatherData(coords.lat, coords.lon);
        updateUI(weather, coords);

        // Success animation re-trigger
        weatherDisplay.classList.remove('animate-fade-in');
        void weatherDisplay.offsetWidth; // Trigger reflow
        weatherDisplay.classList.add('animate-fade-in');

    } catch (err) {
        console.error(err);
        errorState.textContent = "Something went wrong. Please try again later.";
        errorState.classList.remove('hidden');
    } finally {
        loader.classList.add('hidden');
    }
}

searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Initialize map and focus input on load
window.addEventListener('load', () => {
    initMap();
    cityInput.focus();
});
