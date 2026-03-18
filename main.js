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

// 3D Globe Initialization
let globe;
const CLOUDS_IMG_URL = '//unpkg.com/three-globe/example/img/earth-clouds.png';
const CLOUDS_ALT = 0.004;
const CLOUDS_ROTATION_SPEED = -0.006; // deg/frame

function initGlobe() {
    globe = Globe()
        (document.getElementById('globeViz'))
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
        .showAtmosphere(true)
        .atmosphereColor('#38bdf8')
        .atmosphereDaylightAlpha(0.1)
        .htmlElementsData([]) // For markers
        .htmlElement(d => {
            const el = document.createElement('div');
            el.innerHTML = `
                <div class="globe-marker">
                    <div class="dot"></div>
                    <div class="pulse"></div>
                </div>`;
            return el;
        });

    // Custom clouds layer
    const clouds = new THREE.Mesh(
        new THREE.SphereGeometry(globe.getGlobeRadius() * (1 + CLOUDS_ALT), 75, 75),
        new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load(CLOUDS_IMG_URL), transparent: true })
    );
    globe.scene().add(clouds);

    (function rotateClouds() {
        clouds.rotation.y += CLOUDS_ROTATION_SPEED * Math.PI / 180;
        requestAnimationFrame(rotateClouds);
    })();

    // Auto-rotation
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.5;

    // Adjust camera
    globe.pointOfView({ altitude: 2.5 });

    // Handle Resize
    window.addEventListener('resize', () => {
        globe.width(window.innerWidth);
        globe.height(window.innerHeight);
    });
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
    if (!response.ok) throw new Error('Search failed');
    const data = await response.json();
    return data.length === 0 ? null : { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), name: data[0].display_name.split(',')[0] };
}

async function getWeatherData(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=auto`;
    const response = await fetch(url);
    return response.ok ? await response.json() : null;
}

function updateUI(weather, location) {
    const current = weather.current;
    const wmo = WMO_MAP[current.weather_code] || { desc: "Unknown", icon: "❓" };

    cityNameEl.textContent = location.name;
    dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    tempEl.textContent = Math.round(current.temperature_2m);
    descEl.textContent = wmo.desc;
    iconEl.alt = wmo.desc;
    iconEl.parentElement.innerHTML = `<span style="font-size: 80px; filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.4))">${wmo.icon}</span>`;
    humidityEl.textContent = `${current.relative_humidity_2m}%`;
    windEl.textContent = `${current.wind_speed_10m} km/h`;
    feelsLikeEl.textContent = `${Math.round(current.apparent_temperature)}°C`;
    timezoneEl.textContent = weather.timezone_abbreviation;

    // Move Globe to Location
    globe.pointOfView({ lat: location.lat, lng: location.lon, altitude: 0.8 }, 2000);
    
    // Add Marker
    globe.htmlElementsData([{ lat: location.lat, lng: location.lon }]);

    weatherDisplay.classList.remove('hidden');
    emptyState.classList.add('hidden');
    errorState.classList.add('hidden');
}

async function handleSearch() {
    const city = cityInput.value.trim();
    if (!city) return;

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
        if (weather) updateUI(weather, coords);

    } catch (err) {
        console.error(err);
        errorState.textContent = "Something went wrong. Please try again later.";
        errorState.classList.remove('hidden');
    } finally {
        loader.classList.add('hidden');
    }
}

searchBtn.addEventListener('click', handleSearch);
cityInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });

window.addEventListener('load', () => {
    initGlobe();
    cityInput.focus();
});
