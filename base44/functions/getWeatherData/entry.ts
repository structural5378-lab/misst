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

    // Default to Florida coordinates (user can customize)
    const lat = user.location_lat || 28.5383;
    const lon = user.location_lon || -81.3792;

    // Fetch current weather
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`
    );
    const weather = await weatherRes.json();

    // Fetch tropical cyclone data from NHC (NOAA)
    const nhcRes = await fetch('https://www.nhc.noaa.gov/cyclones/current.json');
    let tropicalSystems = [];
    try {
      const nhcData = await nhcRes.json();
      if (nhcData?.active) {
        tropicalSystems = nhcData.active.map((system) => ({
          name: system.name,
          type: system.type,
          category: system.category,
          lat: system.lat,
          lon: system.lon,
          windSpeed: system.maxWind,
          pressure: system.pressure,
          movement: system.movement,
          advisory: system.advisoryNumber,
        }));
      }
    } catch (e) {
      // NHC API might not be available, continue without tropical data
      console.log('NHC tropical data unavailable:', e.message);
    }

    return Response.json({
      current: {
        temp: weather.main?.temp,
        feelsLike: weather.main?.feels_like,
        humidity: weather.main?.humidity,
        windSpeed: weather.wind?.speed,
        windDir: weather.wind?.deg,
        pressure: weather.main?.pressure,
        description: weather.weather?.[0]?.description,
        icon: weather.weather?.[0]?.icon,
        city: weather.name,
      },
      tropical: tropicalSystems,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});