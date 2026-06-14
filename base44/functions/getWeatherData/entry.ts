import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get("WEATHER_API_KEY");
    if (!apiKey) {
      return Response.json({ error: 'Weather API key not configured.' }, { status: 500 });
    }

    // Use provided coords or fall back to Central Florida (Orlando area)
    let body = {};
    try { body = await req.json(); } catch (_) {}
    const lat = body.lat || 28.5383;
    const lon = body.lon || -81.3792;

    // Fetch current weather and forecast in parallel
    const [weatherRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`)
    ]);

    const weather = await weatherRes.json();
    const forecast = await forecastRes.json();

    if (!weatherRes.ok) throw new Error(weather.message || `Weather API error ${weatherRes.status}`);
    if (!forecastRes.ok) throw new Error(forecast.message || `Forecast API error ${forecastRes.status}`);

    // Process forecast to get daily summaries
    const dailyForecast = {};
    (forecast.list || []).forEach(item => {
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

    return Response.json({
      current: {
        temp: Math.round(weather.main.temp),
        feels_like: Math.round(weather.main.feels_like),
        condition: weather.weather[0].main,
        description: weather.weather[0].description,
        icon: weather.weather[0].icon,
        humidity: weather.main.humidity,
        wind_speed: Math.round(weather.wind.speed),
        wind_deg: weather.wind.deg || 0,
        pressure: weather.main.pressure,
        visibility: Math.round(weather.visibility / 1000),
        sunrise: weather.sys.sunrise,
        sunset: weather.sys.sunset,
        name: weather.name
      },
      forecast: Object.values(dailyForecast).slice(0, 5),
      location: { lat, lon }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});