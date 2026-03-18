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

// 3D Globe - Global State
let globe = null;
let retryCount = 0;
const MAX_RETRIES = 50; // 50 * 200ms = 10 seconds total wait

function initGlobe() {
    const container = document.getElementById('globeViz');
    if (!container) return;

    // Check for libraries
    if (typeof Globe === 'undefined' || typeof THREE === 'undefined') {
        retryCount++;
        if (retryCount < MAX_RETRIES) {
            setTimeout(initGlobe, 200);
            return;
        } else {
            console.warn("Globe loading timed out. Enabling static 2D mode.");
            useStaticFallback();
            return;
        }
    }

    try {
        globe = Globe()(container)
            .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
            .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
            .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
            .showAtmosphere(true)
            .atmosphereColor('#38bdf8')
            .atmosphereDaylightAlpha(0.1)
            .htmlElementsData([])
            .htmlElement(d => {
                const el = document.createElement('div');
                el.innerHTML = `
                    <div class="globe-marker">
                        <div class="dot"></div>
                        <div class="pulse"></div>
                    </div>`;
                return el;
            });

        globe.controls().autoRotate = true;
        globe.controls().autoRotateSpeed = 0.5;
        globe.pointOfView({ altitude: 2.5 });

        setTimeout(() => {
            globe.width(window.innerWidth);
            globe.height(window.innerHeight);
        }, 100);

        hideLoadingOverlay();

    } catch (err) {
        console.error("3D Error:", err);
        useStaticFallback();
    }
}

function useStaticFallback() {
    console.log("Using static background fallback.");
    const container = document.getElementById('globeViz');
    container.style.backgroundImage = "url('https://images.unsplash.com/photo-1451187580241-538498af0ca0?auto=format&fit=crop&w=1920&q=80')";
    container.style.backgroundSize = "cover";
    container.style.backgroundPosition = "center";
    hideLoadingOverlay();
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('fade-out');
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
    const response = await fetch(url, { headers: { 'User-Agent': 'SkyCastWeatherApp/1.0' } });
    if (!response.ok) throw new Error('Location error.');
    const data = await response.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), name: data[0].display_name.split(',')[0] };
}

async function getWeatherData(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather error.');
    return await response.json();
}

function updateUI(weather, location) {
    const current = weather.current;
    const wmo = WMO_MAP[current.weather_code] || { desc: "Unknown", icon: "❓" };

    cityNameEl.textContent = location.name;
    dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    tempEl.textContent = Math.round(current.temperature_2m);
    descEl.textContent = wmo.desc;
    iconEl.parentElement.innerHTML = `<span style="font-size: 80px; filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.4))">${wmo.icon}</span>`;
    
    humidityEl.textContent = `${current.relative_humidity_2m}%`;
    windEl.textContent = `${current.wind_speed_10m} km/h`;
    feelsLikeEl.textContent = `${Math.round(current.apparent_temperature)}°C`;
    timezoneEl.textContent = weather.timezone_abbreviation;

    if (globe) {
        globe.pointOfView({ lat: location.lat, lng: location.lon, altitude: 0.8 }, 2000);
        globe.htmlElementsData([{ lat: location.lat, lng: location.lon }]);
    }

    weatherDisplay.classList.remove('hidden');
    emptyState.classList.add('hidden');
    errorState.classList.add('hidden');
}

async function handleSearch() {
    const city = cityInput.value.trim();
    if (!city) return;

    loader.classList.remove('hidden');
    weatherDisplay.classList.add('hidden');
    errorState.classList.add('hidden');

    try {
        const coords = await getCoordinates(city);
        if (!coords) {
            errorState.textContent = "City not found.";
            errorState.classList.remove('hidden');
            return;
        }

        const weather = await getWeatherData(coords.lat, coords.lon);
        updateUI(weather, coords);

    } catch (err) {
        console.error(err);
        errorState.textContent = err.message || "An error occurred.";
        errorState.classList.remove('hidden');
    } finally {
        loader.classList.add('hidden');
    }
}

searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });

window.addEventListener('load', initGlobe);
window.addEventListener('resize', () => {
    if (globe) {
        globe.width(window.innerWidth);
        globe.height(window.innerHeight);
    }
});
