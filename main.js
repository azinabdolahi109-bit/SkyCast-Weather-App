const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherDisplay = document.getElementById('weather-display');
const emptyState = document.getElementById('empty-state');
const errorState = document.getElementById('error-state');
const loader = document.getElementById('loader');
const bgImage = document.getElementById('bg-image');

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

const WMO_MAP = {
    0: { desc: "Clear Sky", icon: "☀️", imgId: "1451187580241-538498af0ca0" },
    1: { desc: "Mainly Clear", icon: "🌤️", imgId: "1446776811953-b23d57bd21aa" },
    2: { desc: "Partly Cloudy", icon: "⛅", imgId: "1446776811953-b23d57bd21aa" },
    3: { desc: "Overcast", icon: "☁️", imgId: "1446776811953-b23d57bd21aa" },
    45: { desc: "Fog", icon: "🌫️", imgId: "1483366774565-83011e144863" },
    48: { desc: "Depositing Rime Fog", icon: "🌫️", imgId: "1483366774565-83011e144863" },
    51: { desc: "Light Drizzle", icon: "🌦️", imgId: "1451188502534-ed55418b32cf" },
    53: { desc: "Moderate Drizzle", icon: "🌦️", imgId: "1451188502534-ed55418b32cf" },
    55: { desc: "Dense Drizzle", icon: "🌦️", imgId: "1451188502534-ed55418b32cf" },
    61: { desc: "Slight Rain", icon: "🌧️", imgId: "1451188502534-ed55418b32cf" },
    63: { desc: "Moderate Rain", icon: "🌧️", imgId: "1451188502534-ed55418b32cf" },
    65: { desc: "Heavy Rain", icon: "⛈️", imgId: "1605727282300-24430156d81b" },
    71: { desc: "Slight Snow", icon: "🌨️", imgId: "1441750545187-5f7222540307" },
    73: { desc: "Moderate Snow", icon: "🌨️", imgId: "1441750545187-5f7222540307" },
    75: { desc: "Heavy Snow", icon: "❄️", imgId: "1441750545187-5f7222540307" },
    95: { desc: "Thunderstorm", icon: "⚡", imgId: "1451186716156-3de7af10dfba" },
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

function updateBackground(imgId) {
    const imageUrl = `https://images.unsplash.com/photo-${imgId}?auto=format&fit=crop&w=1920&q=80`;
    bgImage.style.backgroundImage = `url('${imageUrl}')`;
}

function updateUI(weather, location) {
    const current = weather.current;
    const wmo = WMO_MAP[current.weather_code] || { desc: "Unknown", icon: "❓", imgId: "1464822759023-fed622ff2c3b" };

    cityNameEl.textContent = location.name;
    dateEl.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    tempEl.textContent = Math.round(current.temperature_2m);
    descEl.textContent = wmo.desc;
    
    iconEl.alt = wmo.desc;
    iconEl.parentElement.innerHTML = `<span style="font-size: 80px; filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.4))">${wmo.icon}</span>`;

    humidityEl.textContent = `${current.relative_humidity_2m}%`;
    windEl.textContent = `${current.wind_speed_10m} km/h`;
    feelsLikeEl.textContent = `${Math.round(current.apparent_temperature)}°C`;
    timezoneEl.textContent = weather.timezone_abbreviation;

    // Update Background
    updateBackground(wmo.imgId);

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
        updateUI(weather, coords);
        
        weatherDisplay.classList.remove('animate-fade-in');
        void weatherDisplay.offsetWidth; 
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

window.addEventListener('load', () => cityInput.focus());
