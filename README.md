# SkyCast - Modern Weather Dashboard 🌤️

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://azinabdolahi109-bit.github.io/SkyCast-Weather-App/)
[![GitHub Pages](https://img.shields.io/badge/deployment-GitHub%20Pages-blue)](https://pages.github.com/)

**SkyCast** is a premium, minimalist weather forecasting application designed for a sleek and immersive user experience. It combines real-time weather data with an interactive, clean map background to provide users with essential information at a glance.

---

## 🚀 Live Demo

Check out the live application here: [**SkyCast Weather App**](https://azinabdolahi109-bit.github.io/SkyCast-Weather-App/)

---

## ✨ Features

- **Minimalist Map Interface**: A distraction-free map background (CartoDB No Labels) that focuses purely on geography and weather.
- **Dynamic Weather Icons**: Pulsing, high-quality weather markers that update automatically on the map based on the current search.
- **Glassmorphism Design**: A premium, semi-transparent dashboard in the corner for a modern, high-end feel.
- **Real-time Geocoding**: Automatically converts city names into coordinates using the Nominatim API.
- **Comprehensive Weather Data**: Displays temperature, "Feels Like," humidity, wind speed, and weather descriptions.
- **Responsive Layout**: Designed to work gracefully across desktops, tablets, and mobile devices.

---

## 🛠️ Technology Stack

- **Core**: HTML5, Vanilla JavaScript (ES6+), CSS3
- **Mapping**: [Leaflet.js](https://leafletjs.com/)
- **API Services**:
  - [Open-Meteo](https://open-meteo.com/) (Weather forecasts)
  - [Nominatim (OSM)](https://nominatim.openstreetmap.org/) (Geocoding)
  - [CartoDB](https://carto.com/help/working-with-data/carto-base-maps/) (Minimalist map tiles)
- **Typography**: [Outfit](https://fonts.google.com/specimen/Outfit) via Google Fonts

---

## 📦 Installation & Local Development

To run this project locally on your machine:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/azinabdolahi109-bit/SkyCast-Weather-App.git
   cd SkyCast-Weather-App
   ```

2. **Open the project**:
   You can simply open `index.html` in your browser, or use a local development server:
   ```bash
   # If you have npm installed
   npm install
   npm start
   ```

---

## 🎨 Customizing the App

### Changing the Map Style
You can modify the `main.js` file to switch between different CartoDB themes:
- **Dark (No Labels)**: `dark_nolabels` (Default)
- **Light (No Labels)**: `light_nolabels`

### Adjusting Animations
The pulsing icon animation can be modified in the `.custom-weather-icon` class within `style.css`.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

Created by [**azinabdolahi109-bit**](https://github.com/azinabdolahi109-bit)
