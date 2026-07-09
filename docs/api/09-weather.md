# 9. Weather

## GET /api/weather

Get current weather for a location.

**Auth:** Bearer  
**Rate Limit:** 30 requests / min / user  
**Permissions:** Member

**Query Parameters:**
| Param | Type | Required | Description |
|---|---|---|---|
| `lat` | float | Yes | Latitude |
| `lng` | float | Yes | Longitude |
| `units` | string | No | `imperial` (default) or `metric` |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "location": {
      "name": "Miami",
      "region": "FL",
      "lat": 25.7617,
      "lng": -80.1918
    },
    "current": {
      "temp_f": 87,
      "temp_c": 30.6,
      "condition": "Partly cloudy",
      "condition_icon": "https://...",
      "wind_mph": 12,
      "wind_dir": "E",
      "humidity": 65,
      "pressure_in": 30.05,
      "visibility_miles": 10,
      "uv_index": 8,
      "feels_like_f": 95
    },
    "forecast": [
      {
        "date": "2026-07-09",
        "max_temp_f": 90,
        "min_temp_f": 78,
        "condition": "Thunderstorms",
        "chance_of_rain": 70
      }
    ]
  },
  "meta": {
    "cached": true,
    "cache_expires_at": "2026-07-09T14:45:00Z"
  }
}
```

---

## GET /api/weather/storms

Get active tropical cyclone data from NOAA NHC.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Member

**Response (200):**
```json
{
  "success": true,
  "data": {
    "active_storms": [
      {
        "id": "al052026",
        "name": "Tropical Storm Bret",
        "classification": "Tropical Storm",
        "wind_speed_kt": 55,
        "wind_speed_mph": 63,
        "pressure_mb": 998,
        "location": "14.5N, 58.2W",
        "movement": "WNW at 18 mph",
        "advisory_number": 12,
        "advisory_text": "...",
        "last_updated": "2026-07-09T09:00:00Z"
      }
    ],
    "no_active_storms": false
  }
}
```

---

## GET /api/weather/radar

Get radar imagery URL for a region.

**Auth:** Bearer  
**Rate Limit:** 30 requests / min / user  
**Permissions:** Member

**Query Parameters:**
| Param | Type | Description |
|---|---|---|
| `lat` | float | Center latitude |
| `lng` | float | Center longitude |
| `zoom` | int | Zoom level (1-10) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "radar_url": "https://...",
    "satellite_url": "https://...",
    "timestamp": "2026-07-09T14:30:00Z"
  }
}
``