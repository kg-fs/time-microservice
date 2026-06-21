const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Clave de API real de WeatherAPI.com colocada directamente en el código
const WEATHER_API_KEY = "918194e388c44b24ac5192041262106";

// Middlewares
app.use(cors());
app.use(express.json());

// Log requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Helper function to generate mock timezone/time data
function getMockTime(locationName) {
    const cleanName = locationName.trim();
    const cleanLower = cleanName.toLowerCase();
    const hash = Array.from(cleanName).reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Mapeo básico de zonas horarias reales para pruebas comunes
    const tzDatabase = {
        'nicaragua': { tz_id: 'America/Managua', offset: -6, country: 'Nicaragua' },
        'managua': { tz_id: 'America/Managua', offset: -6, country: 'Nicaragua' },
        'spain': { tz_id: 'Europe/Madrid', offset: 2, country: 'Spain' },
        'españa': { tz_id: 'Europe/Madrid', offset: 2, country: 'Spain' },
        'espana': { tz_id: 'Europe/Madrid', offset: 2, country: 'Spain' },
        'madrid': { tz_id: 'Europe/Madrid', offset: 2, country: 'Spain' },
        'argentina': { tz_id: 'America/Argentina/Buenos_Aires', offset: -3, country: 'Argentina' },
        'buenos aires': { tz_id: 'America/Argentina/Buenos_Aires', offset: -3, country: 'Argentina' },
        'japan': { tz_id: 'Asia/Tokyo', offset: 9, country: 'Japan' },
        'japon': { tz_id: 'Asia/Tokyo', offset: 9, country: 'Japan' },
        'japón': { tz_id: 'Asia/Tokyo', offset: 9, country: 'Japan' },
        'tokyo': { tz_id: 'Asia/Tokyo', offset: 9, country: 'Japan' },
        'tokio': { tz_id: 'Asia/Tokyo', offset: 9, country: 'Japan' },
        'united states': { tz_id: 'America/New_York', offset: -4, country: 'United States' },
        'usa': { tz_id: 'America/New_York', offset: -4, country: 'United States' },
        'us': { tz_id: 'America/New_York', offset: -4, country: 'United States' },
        'new york': { tz_id: 'America/New_York', offset: -4, country: 'United States' },
        'united kingdom': { tz_id: 'Europe/London', offset: 1, country: 'United Kingdom' },
        'uk': { tz_id: 'Europe/London', offset: 1, country: 'United Kingdom' },
        'london': { tz_id: 'Europe/London', offset: 1, country: 'United Kingdom' },
        'colombia': { tz_id: 'America/Bogota', offset: -5, country: 'Colombia' },
        'bogota': { tz_id: 'America/Bogota', offset: -5, country: 'Colombia' },
        'bogotá': { tz_id: 'America/Bogota', offset: -5, country: 'Colombia' }
    };

    let tzInfo = tzDatabase[cleanLower];
    if (!tzInfo) {
        // Si no está en el mapa común, genera un offset entre -11 y +12 de forma pseudo-aleatoria
        const offset = -11 + (hash % 24);
        const countryName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
        tzInfo = {
            tz_id: `Etc/GMT${offset >= 0 ? '-' : '+'}${Math.abs(offset)}`,
            offset: offset,
            country: countryName
        };
    }

    // Calcula la hora local correspondiente a ese offset
    const nowUtc = new Date();
    const localTimeMs = nowUtc.getTime() + (tzInfo.offset * 60 * 60 * 1000);
    const localDate = new Date(localTimeMs);

    // Formato exacto YYYY-MM-DD HH:mm que devuelve WeatherAPI
    const yyyy = localDate.getUTCFullYear();
    const mm = String(localDate.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(localDate.getUTCDate()).padStart(2, '0');
    const hh = String(localDate.getUTCHours()).padStart(2, '0');
    const min = String(localDate.getUTCMinutes()).padStart(2, '0');
    const localtimeStr = `${yyyy}-${mm}-${dd} ${hh}:${min}`;

    return {
        name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase(),
        country: tzInfo.country,
        timezone: tzInfo.tz_id,
        localtime: localtimeStr,
        isMock: true
    };
}

// Function to fetch timezone and time from external API or fallback to mock
async function fetchTime(location) {
    if (!WEATHER_API_KEY || WEATHER_API_KEY.trim() === "" || WEATHER_API_KEY === "TU_WEATHER_API_KEY_AQUI") {
        return getMockTime(location);
    }

    try {
        const url = `https://api.weatherapi.com/v1/timezone.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(location)}`;
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `WeatherAPI status ${response.status}`);
        }

        const data = await response.json();
        return {
            name: data.location.name,
            country: data.location.country,
            timezone: data.location.tz_id,
            localtime: data.location.localtime,
            isMock: false
        };
    } catch (error) {
        console.warn(`[Warning] Error fetching real time for "${location}" (falling back to mock data):`, error.message);
        return getMockTime(location);
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: "UP",
        service: "time-microservice",
        timestamp: new Date().toISOString(),
        timeSource: (WEATHER_API_KEY && WEATHER_API_KEY !== "TU_WEATHER_API_KEY_AQUI") ? "WeatherAPI Timezone" : "Mock Fallback (No API Key)"
    });
});

// Time endpoint (Returns ONLY the time of the requested location)
app.get('/api/time', async (req, res, next) => {
    try {
        const { country } = req.query;

        if (!country) {
            return res.status(400).json({
                error: "Missing parameter",
                message: "You must provide a 'country' or 'city' query parameter. Example: /api/time?country=Spain"
            });
        }

        console.log(`Processing time request for requested country: "${country}"`);

        const timeData = await fetchTime(country);
        res.json(timeData);
    } catch (error) {
        next(error);
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
        error: "Internal Server Error",
        message: err.message || "An unexpected error occurred."
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` Time Microservice started on port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/health`);
    console.log(` API Endpoint: http://localhost:${PORT}/api/time?country=Spain`);
    if (!WEATHER_API_KEY || WEATHER_API_KEY === "TU_WEATHER_API_KEY_AQUI") {
        console.log(` Mode: Using MOCK timezone data (Configure WEATHER_API_KEY to use real API)`);
    } else {
        console.log(` Mode: Using real WeatherAPI Timezone data`);
    }
    console.log(`==================================================`);
});
