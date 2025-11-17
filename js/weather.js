// Enhanced Weather Functionality (Refactored & Fixed)
const Weather = {
    apiKey: null,
    city: 'Jakarta',
    currentWeather: null,
    forecast: [],
    favorites: [],
    units: 'metric',
    weatherCache: new Map(),
    refreshTimer: null,

    init() {
        this.loadSettings();
        this.loadFavorites();
        this.setupEventListeners();
        this.loadWeatherData();
        this.setupAutoRefresh();
    },

    // ----------------------------------------
    // SETTINGS
    // ----------------------------------------
    loadSettings() {
        const settings = Storage.get('weather-settings') || {};
        this.city = settings.city || 'Jakarta';
        this.units = settings.units || 'metric';
        this.apiKey = settings.apiKey || null;
    },

    saveSettings() {
        Storage.set('weather-settings', {
            city: this.city,
            units: this.units,
            apiKey: this.apiKey
        });
    },

    // ----------------------------------------
    // FAVORITES
    // ----------------------------------------
    loadFavorites() {
        const saved = Storage.get('weather-favorites');
        this.favorites = Array.isArray(saved) ? saved : [];
    },

    saveFavorites() {
        Storage.set('weather-favorites', this.favorites);
    },

    addToFavorites() {
        if (!this.currentWeather) return;

        const f = {
            city: this.currentWeather.city,
            country: this.currentWeather.country,
            main: this.currentWeather.main,
            description: this.currentWeather.description,
            temperature: this.currentWeather.temperature,
            icon: this.currentWeather.icon,
            addedAt: new Date().toISOString()
        };

        const exists = this.favorites.some(
            x => x.city === f.city && x.country === f.country
        );

        if (!exists) {
            this.favorites.unshift(f);
            if (this.favorites.length > 15) this.favorites.pop();
            this.saveFavorites();
            this.showNotification(`${f.city} ditambahkan ke favorit`, 'success');
        }
    },

    removeFromFavorites(city, country) {
        this.favorites = this.favorites.filter(f => !(f.city === city && f.country === country));
        this.saveFavorites();
        this.showNotification(`${city} dihapus dari favorit`, 'info');
    },

    // ----------------------------------------
    // EVENT LISTENERS
    // ----------------------------------------
    setupEventListeners() {
        const locationEl = document.getElementById('location');
        const refreshBtn = document.getElementById('refresh-weather');
        const addFavoriteBtn = document.getElementById('add-favorite');

        if (locationEl) {
            locationEl.addEventListener('click', () => this.changeCity());
            locationEl.addEventListener('dblclick', () => this.addToFavorites());
        }

        if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadWeatherData());
        if (addFavoriteBtn) addFavoriteBtn.addEventListener('click', () => this.addToFavorites());
    },

    // ----------------------------------------
    // AUTO REFRESH
    // ----------------------------------------
    setupAutoRefresh() {
        if (this.refreshTimer) clearInterval(this.refreshTimer);

        // Refresh tiap 10 menit (lebih aman utk API limit)
        this.refreshTimer = setInterval(() => this.loadWeatherData(), 10 * 60 * 1000);
    },

    // ----------------------------------------
    // CACHE
    // ----------------------------------------
    saveToCache(weather) {
        const data = { ...weather, cachedAt: Date.now() };
        Storage.set(`weather-${weather.city}`, data);
    },

    getFromCache(city) {
        const cache = Storage.get(`weather-${city}`);
        if (!cache) return null;

        const diff = (Date.now() - cache.cachedAt) / 1000 / 60;
        return diff < 30 ? cache : null;
    },

    // ----------------------------------------
    // FETCH DATA
    // ----------------------------------------
    async loadWeatherData() {
        if (!this.apiKey) {
            this.showMockWeather();
            return;
        }

        const cached = this.getFromCache(this.city);
        if (cached) {
            this.currentWeather = cached;
            this.updateUI(cached);
            this.getForecast(); // tetap ambil forecast
            return;
        }

        try {
            const data = await this.fetchWeatherData();
            this.currentWeather = data;
            this.updateUI(data);
            this.saveToCache(data);

            this.getForecast();
        } catch (err) {
            console.error(err);
            this.showNotification('Gagal memuat data cuaca', 'error');
            this.showMockWeather();
        }
    },

    async fetchWeatherData() {
        const url =
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(this.city)}&appid=${this.apiKey}&units=${this.units}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Weather API error');

        const data = await res.json();

        return {
            city: data.name,
            country: data.sys.country,
            main: data.weather[0].main,
            description: data.weather[0].description,
            temperature: Math.round(data.main.temp),
            feelsLike: Math.round(data.main.feels_like),
            humidity: data.main.humidity,
            pressure: data.main.pressure,
            windSpeed: data.wind.speed,
            windDirection: data.wind.deg,
            visibility: data.visibility,
            clouds: data.clouds.all,
            sunrise: data.sys.sunrise * 1000,
            sunset: data.sys.sunset * 1000,
            icon: data.weather[0].icon
        };
    },

    // ----------------------------------------
    // FORECAST (FIXED)
    // ----------------------------------------
    async getForecast() {
        if (!this.apiKey) return;

        try {
            const url =
                `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(this.city)}&appid=${this.apiKey}&units=${this.units}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('Forecast API error');

            const data = await res.json();

            this.forecast = data.list.slice(0, 5);
            this.updateForecastUI();
        } catch (err) {
            console.error('Forecast error:', err);
        }
    },

    updateForecastUI() {
        const el = document.getElementById('weather-forecast');
        if (!el) return;

        if (this.forecast.length === 0) {
            el.innerHTML = '<p class="text-center text-gray-500">Tidak ada data prakiraan</p>';
            return;
        }

        el.innerHTML = this.forecast
            .map(day => {
                const dt = new Date(day.dt * 1000);
                const dateStr = dt.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                });

                const icon = this.getWeatherIcon(day.weather[0].icon);
                const color = this.getWeatherColor(day.weather[0].main);

                return `
                    <div class="flex items-center justify-between p-3 border-b">
                        <div class="flex items-center">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                                style="background-color:${color}">
                                <i class="fas ${icon} text-white"></i>
                            </div>
                            <div>
                                <p class="font-semibold">${dateStr}</p>
                                <p class="text-sm text-gray-600">${day.weather[0].description}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-2xl font-bold">${Math.round(day.main.temp)}°</p>
                            <p class="text-sm text-gray-600">${Math.round(day.main.feels_like)}°</p>
                        </div>
                    </div>
                `;
            })
            .join('');
    },

    // ----------------------------------------
    // UI
    // ----------------------------------------
    updateUI(w) {
        if (!w) return;

        this.setText('temperature', `${w.temperature}${this.units === 'metric' ? '°C' : '°F'}`);
        this.setText('weather-desc', w.description);
        this.setText('location', w.city);
        this.setText('feels-like', `Terasa ${w.feelsLike}${this.units === 'metric' ? '°C' : '°F'}`);
        this.setText('humidity', `Kelembaban: ${w.humidity}%`);
        this.setText('wind', `${w.windSpeed} ${this.units === 'metric' ? 'm/s' : 'mph'}`);

        const iconEl = document.getElementById('weather-icon');
        if (iconEl) {
            iconEl.className = `fas ${this.getWeatherIcon(w.icon)} text-4xl`;
            iconEl.style.color = this.getWeatherColor(w.main);
        }

        this.updateWeatherDetails(w);
    },

    updateWeatherDetails(w) {
        this.setText('pressure', `${w.pressure} hPa`);
        this.setText('visibility', `${(w.visibility / 1000).toFixed(1)} km`);
        this.setText('sunrise', new Date(w.sunrise).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        this.setText('sunset', new Date(w.sunset).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    },

    setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    },

    // ----------------------------------------
    // UTILITIES
    // ----------------------------------------
    getWeatherIcon(code) {
        const map = {
            '01d': 'fa-sun',
            '01n': 'fa-moon',
            '02d': 'fa-cloud-sun',
            '02n': 'fa-cloud-moon',
            '03d': 'fa-cloud',
            '03n': 'fa-cloud-moon',
            '04d': 'fa-cloud',
            '04n': 'fa-cloud',
            '09d': 'fa-cloud-rain',
            '09n': 'fa-cloud-rain',
            '10d': 'fa-cloud-showers-heavy',
            '10n': 'fa-cloud-showers-heavy',
            '11d': 'fa-bolt',
            '11n': 'fa-bolt',
            '13d': 'fa-snowflake',
            '13n': 'fa-snowflake',
            '50d': 'fa-smog',
            '50n': 'fa-smog'
        };
        return map[code] || 'fa-question';
    },

    getWeatherColor(main) {
        const colors = {
            Clear: '#FFD700',
            Clouds: '#B0C4DE',
            Rain: '#1E3A8A',
            Drizzle: '#616161',
            Thunderstorm: '#37474F',
            Snow: '#B0E0E0',
            Mist: '#9E9E9E',
            Fog: '#9E9E9E',
            Haze: '#D3D3D3'
        };
        return colors[main] || '#A0A0A0';
    },

    changeCity() {
        const c = prompt('Masukkan nama kota:', this.city);
        if (c && c.trim()) {
            this.city = c.trim();
            this.saveSettings();
            this.loadWeatherData();
        }
    },

    showMockWeather() {
        const mock = {
            city: this.city,
            main: 'Clouds',
            description: 'Cerah Berawan',
            temperature: 28,
            feelsLike: 30,
            humidity: 65,
            pressure: 1013,
            windSpeed: 3.5,
            windDirection: 135,
            visibility: 10000,
            icon: '03d',
            sunrise: Date.now(),
            sunset: Date.now()
        };

        this.currentWeather = mock;
        this.updateUI(mock);
    },

    showNotification(text, type = 'success') {
        if (typeof App !== 'undefined' && App.showNotification) {
            App.showNotification(text, type);
        }
    }
};
