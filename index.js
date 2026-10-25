
const express = require('express');
const path = require('path');
const axios = require('axios');

require('dotenv').config({
  path: path.join(__dirname, '.env')
});

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.WEATHER_API_KEY;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.render('dashboard');
});

// Get current weather and the available five-day forecast.
app.get('/api/weather', async (req, res) => {
  const city = String(req.query.city || '').trim();

  if (!API_KEY) {
    return res.status(500).json({
      message: 'Weather API key is missing. Check your .env file.'
    });
  }

  if (!city) {
    return res.status(400).json({
      message: 'Enter a city name to search.'
    });
  }

  try {
    const currentResponse = await axios.get(
      'https://api.openweathermap.org/data/2.5/weather',
      {
        params: {
          q: city,
          appid: API_KEY,
          units: 'metric'
        },
        timeout: 10000
      }
    );

    const current = currentResponse.data;

    const forecastResponse = await axios.get(
      'https://api.openweathermap.org/data/2.5/forecast',
      {
        params: {
          lat: current.coord.lat,
          lon: current.coord.lon,
          appid: API_KEY,
          units: 'metric'
        },
        timeout: 10000
      }
    );

    const groupedDays = {};

    for (const item of forecastResponse.data.list || []) {
      const date = item.dt_txt.slice(0, 10);

      if (!groupedDays[date]) {
        groupedDays[date] = [];
      }

      groupedDays[date].push(item);
    }

    const forecast = Object.entries(groupedDays)
      .slice(0, 6)
      .map(([date, entries]) => {
        const midday =
          entries.find(item => item.dt_txt.includes('12:00:00')) ||
          entries[Math.floor(entries.length / 2)];

        return {
          date,
          day: new Date(`${date}T12:00:00`).toLocaleDateString(
            'en-US',
            { weekday: 'short' }
          ),
          min: Math.round(
            Math.min(...entries.map(item => item.main.temp_min))
          ),
          max: Math.round(
            Math.max(...entries.map(item => item.main.temp_max))
          ),
          temp: Math.round(midday.main.temp),
          condition: midday.weather[0].main,
          description: midday.weather[0].description,
          icon: midday.weather[0].icon
        };
      });

    // Air quality is optional.
    let aqi = null;

    try {
      const airResponse = await axios.get(
        'https://api.openweathermap.org/data/2.5/air_pollution',
        {
          params: {
            lat: current.coord.lat,
            lon: current.coord.lon,
            appid: API_KEY
          },
          timeout: 7000
        }
      );

      const airItem = airResponse.data.list?.[0];

      if (airItem) {
        aqi = {
          value: airItem.main.aqi,
          components: airItem.components
        };
      }
    } catch (error) {
      console.log('Air quality data is currently unavailable.');
    }

    res.json({
      city: current.name,
      country: current.sys.country,
      temp: Math.round(current.main.temp),
      feelsLike: Math.round(current.main.feels_like),
      condition: current.weather[0].main,
      description: current.weather[0].description,
      icon: current.weather[0].icon,
      humidity: current.main.humidity,
      wind: current.wind.speed,
      pressure: current.main.pressure,
      visibility:
        current.visibility == null
          ? null
          : (current.visibility / 1000).toFixed(1),
      sunrise: current.sys.sunrise,
      sunset: current.sys.sunset,
      timezone: current.timezone,
      forecast,
      aqi,
      updatedAt: current.dt
    });
  } catch (error) {
    const status = error.response?.status;

    if (status === 404) {
      return res.status(404).json({
        message: 'City not found. Check the spelling and try again.'
      });
    }

    if (status === 401) {
      return res.status(502).json({
        message: 'The API key is invalid or not active yet.'
      });
    }

    console.error('Weather request failed:', error.message);

    return res.status(502).json({
      message: 'Weather data could not be loaded. Check your connection and try again.'
    });
  }
});

// Get the forecast for a date selected in the calendar.
app.get('/api/weather/day', async (req, res) => {
  const city = String(req.query.city || '').trim();
  const date = String(req.query.date || '').trim();

  if (!API_KEY) {
    return res.status(500).json({
      message: 'Weather API key is missing. Check your .env file.'
    });
  }

  if (
    !city ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(`${date}T00:00:00Z`))
  ) {
    return res.status(400).json({
      message: 'A city and valid date are required.'
    });
  }

  try {
    const geoResponse = await axios.get(
      'https://api.openweathermap.org/geo/1.0/direct',
      {
        params: {
          q: city,
          limit: 1,
          appid: API_KEY
        },
        timeout: 10000
      }
    );

    if (!geoResponse.data.length) {
      return res.status(404).json({
        message: 'City not found.'
      });
    }

    const { lat, lon } = geoResponse.data[0];

    const response = await axios.get(
      'https://api.openweathermap.org/data/2.5/forecast',
      {
        params: {
          lat,
          lon,
          appid: API_KEY,
          units: 'metric'
        },
        timeout: 10000
      }
    );

    const entries = response.data.list.filter(
      item => item.dt_txt.startsWith(date)
    );

    if (!entries.length) {
      return res.status(404).json({
        message:
          'Forecast unavailable for this date. Forecast data usually covers only the next five days.'
      });
    }

    const midday =
      entries.find(item => item.dt_txt.includes('12:00:00')) ||
      entries[Math.floor(entries.length / 2)];

    res.json({
      date,
      city: geoResponse.data[0].name,
      temp: Math.round(midday.main.temp),
      feelsLike: Math.round(midday.main.feels_like),
      condition: midday.weather[0].main,
      description: midday.weather[0].description,
      icon: midday.weather[0].icon,
      humidity: midday.main.humidity,
      wind: midday.wind.speed,
      pressure: midday.main.pressure,
      min: Math.round(
        Math.min(...entries.map(item => item.main.temp_min))
      ),
      max: Math.round(
        Math.max(...entries.map(item => item.main.temp_max))
      )
    });
  } catch (error) {
    const status = error.response?.status;

    if (status === 401) {
      return res.status(502).json({
        message: 'The API key is invalid or not active yet.'
      });
    }

    console.error('Selected-date forecast failed:', error.message);

    res.status(502).json({
      message: 'Could not load the forecast for that date.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Weather Forecast running at http://localhost:${PORT}`);
});
