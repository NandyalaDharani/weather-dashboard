const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");

const loading = document.getElementById("loading");
const errorMessage = document.getElementById("errorMessage");
const weatherContainer =
    document.getElementById("weatherContainer");

const cityName = document.getElementById("cityName");
const countryName = document.getElementById("countryName");

const temperature =
    document.getElementById("temperature");

const feelsLike =
    document.getElementById("feelsLike");

const humidity =
    document.getElementById("humidity");

const windSpeed =
    document.getElementById("windSpeed");

const pressure =
    document.getElementById("pressure");

const visibility =
    document.getElementById("visibility");

const weatherDescription =
    document.getElementById("weatherDescription");

const weatherIcon =
    document.getElementById("weatherIcon");

const updatedTime =
    document.getElementById("updatedTime");

const hourlyForecast =
    document.getElementById("hourlyForecast");

const dailyForecast =
    document.getElementById("dailyForecast");


const GEOCODING_API =
    "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_API =
    "https://api.open-meteo.com/v1/forecast";


searchForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        showError("Please enter a city name.");
        return;
    }

    await getWeather(city);

});


async function getWeather(city) {

    try {

        showLoading();
        hideError();

        const location = await getLocation(city);

        const weather =
            await getWeatherData(
                location.latitude,
                location.longitude
            );

        displayCurrentWeather(location, weather);

        displayHourlyForecast(weather);

        displayDailyForecast(weather);

        weatherContainer.classList.remove("hidden");

    } catch (error) {

        console.error(error);

        showError(error.message);

    } finally {

        hideLoading();

    }

}


async function getLocation(city) {

    const url =
        `${GEOCODING_API}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to search for this city.");
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
        throw new Error(
            `No location found for "${city}".`
        );
    }

    return data.results[0];

}


async function getWeatherData(latitude, longitude) {

    const url =
        `${WEATHER_API}?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,wind_speed_10m,visibility,weather_code` +
        `&hourly=temperature_2m,weather_code,precipitation_probability` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
        `&timezone=auto` +
        `&forecast_days=7`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            "Unable to fetch weather information."
        );
    }

    return await response.json();

}


function displayCurrentWeather(location, data) {

    const current = data.current;

    cityName.textContent =
        location.name;

    countryName.textContent =
        `${location.country}`;

    temperature.textContent =
        Math.round(current.temperature_2m);

    feelsLike.textContent =
        Math.round(current.apparent_temperature);

    humidity.textContent =
        current.relative_humidity_2m;

    windSpeed.textContent =
        current.wind_speed_10m;

    pressure.textContent =
        Math.round(current.pressure_msl);

    visibility.textContent =
        Math.round(current.visibility / 1000);

    weatherDescription.textContent =
        getWeatherDescription(
            current.weather_code
        );

    weatherIcon.textContent =
        getWeatherIcon(
            current.weather_code
        );

    updatedTime.textContent =
        new Date(current.time)
            .toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });

}


function displayHourlyForecast(data) {

    hourlyForecast.innerHTML = "";

    const times = data.hourly.time;
    const temperatures = data.hourly.temperature_2m;
    const codes = data.hourly.weather_code;

    const currentTime =
        new Date(data.current.time);

    let startIndex = 0;

    for (let i = 0; i < times.length; i++) {

        if (new Date(times[i]) >= currentTime) {
            startIndex = i;
            break;
        }

    }

    for (
        let i = startIndex;
        i < Math.min(startIndex + 12, times.length);
        i++
    ) {

        const card =
            document.createElement("div");

        card.className = "hour";

        const time =
            new Date(times[i])
                .toLocaleTimeString([], {
                    hour: "numeric"
                });

        card.innerHTML = `
            <div class="hour-time">
                ${time}
            </div>

            <div class="hour-icon">
                ${getWeatherIcon(codes[i])}
            </div>

            <div class="hour-temp">
                ${Math.round(temperatures[i])}°
            </div>
        `;

        hourlyForecast.appendChild(card);

    }

}


function displayDailyForecast(data) {

    dailyForecast.innerHTML = "";

    const dates = data.daily.time;
    const codes = data.daily.weather_code;
    const maxTemps =
        data.daily.temperature_2m_max;

    const minTemps =
        data.daily.temperature_2m_min;

    for (let i = 0; i < dates.length; i++) {

        const date =
            new Date(dates[i] + "T12:00:00");

        const dayName =
            i === 0
                ? "Today"
                : date.toLocaleDateString(
                    [],
                    { weekday: "short" }
                );

        const row =
            document.createElement("div");

        row.className = "day";

        row.innerHTML = `
            <div class="day-name">
                ${dayName}
            </div>

            <div class="day-icon">
                ${getWeatherIcon(codes[i])}
            </div>

            <div class="day-description">
                ${getWeatherDescription(codes[i])}
            </div>

            <div class="day-temp">
                ${Math.round(maxTemps[i])}°
                /
                ${Math.round(minTemps[i])}°
            </div>
        `;

        dailyForecast.appendChild(row);

    }

}


function getWeatherDescription(code) {

    const descriptions = {

        0: "Clear sky",

        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",

        45: "Fog",
        48: "Fog",

        51: "Light drizzle",
        53: "Drizzle",
        55: "Heavy drizzle",

        61: "Light rain",
        63: "Rain",
        65: "Heavy rain",

        71: "Light snow",
        73: "Snow",
        75: "Heavy snow",

        80: "Rain showers",
        81: "Rain showers",
        82: "Heavy rain showers",

        95: "Thunderstorm",
        96: "Thunderstorm",
        99: "Thunderstorm"

    };

    return descriptions[code] ||
        "Unknown conditions";

}


function getWeatherIcon(code) {

    if (code === 0)
        return "☀️";

    if (code === 1 || code === 2)
        return "🌤️";

    if (code === 3)
        return "☁️";

    if (code === 45 || code === 48)
        return "🌫️";

    if (code >= 51 && code <= 67)
        return "🌧️";

    if (code >= 71 && code <= 77)
        return "❄️";

    if (code >= 80 && code <= 82)
        return "🌦️";

    if (code >= 95)
        return "⛈️";

    return "🌡️";

}


function showLoading() {

    loading.classList.remove("hidden");

}


function hideLoading() {

    loading.classList.add("hidden");

}


function showError(message) {

    errorMessage.textContent = message;

    errorMessage.classList.remove("hidden");

}


function hideError() {

    errorMessage.classList.add("hidden");

}


/* Default city */

getWeather("Kurnool");