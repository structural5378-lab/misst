import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get("WEATHER_API_KEY");
    if (!apiKey) {
      return Response.json({ error: 'Weather API key not configured' }, { status: 500 });
    }

    // Default to Central Florida (Orlando area)
    const lat = user.location_lat || 28.5383;
    const lon = user.location_lon || -81.3792;

    // Fetch current weather
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`
    );
    const weather = await weatherRes.json();

    // Fetch 5-day forecast
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`
    );
    const forecast = await forecastRes.json();

    // Process forecast to get daily summaries
    const dailyForecast = {};
    forecast.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyForecast[date]) {
        dailyForecast[date] = {
          date,
          temp_max: item.main.temp_max,
          temp_min: item.main.temp_min,
          condition: item.weather[0].main,
          icon: item.weather[0].icon,
          description: item.weather[0].description
        };
      } else {
        dailyForecast[date].temp_max = Math.max(dailyForecast[date].temp_max, item.main.temp_max);
        dailyForecast[date].temp_min = Math.min(dailyForecast[date].temp_min, item.main.temp_min);
      }
    });

    const forecastArray = Object.values(dailyForecast).slice(0, 5);

    return Response.json({
      current: {
        temp: Math.round(weather.main.temp),
        feels_like: Math.round(weather.main.feels_like),
        condition: weather.weather[0].main,
        description: weather.weather[0].description,
        icon: weather.weather[0].icon,
        humidity: weather.main.humidity,
        wind_speed: Math.round(weather.wind.speed),
        wind_deg: weather.wind.deg,
        pressure: weather.main.pressure,
        visibility: Math.round(weather.visibility / 1000),
        sunrise: weather.sys.sunrise,
        sunset: weather.sys.sunset,
        name: weather.name
      },
      forecast: forecastArray,
      location: { lat, lon }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});