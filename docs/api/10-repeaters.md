# 10. Repeaters

## GET /api/repeaters

List repeaters with geo-search.

**Auth:** Bearer  
**Rate Limit:** 30 requests / min / user  
**Permissions:** Member

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `lat` | float | null | Center latitude for radius search |
| `lng` | float | null | Center longitude for radius search |
| `radius` | int | 50 | Search radius in miles |
| `band` | string | null | `uhf` or `vhf` |
| `status` | string | null | `online`, `offline`, `busy` |
| `search` | string | null | Search callsign/location |
| `cursor` | string | null | Pagination cursor |
| `limit` | int | 50 | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "rep_abc123",
      "callsign": "K4MIA",
      "frequency": 462.675,
      "offset": "+5.0 MHz",
      "tone": "141.3",
      "location": "Miami, FL",
      "latitude": 25.7617,
      "longitude": -80.1918,
      "status": "online",
      "owner_callsign": "K4ABC",
      "description": "Miami-Dade GMRS repeater",
      "image_url": "https://...",
      "distance_miles": 2.3,
      "is_favorite": false
    }
  ],
  "meta": {
    "pagination": {
      "next_cursor": "...",
      "has_more": true,
      "limit": 50
    }
  }
}
```

---

## GET /api/repeaters/{id}

Get a single repeater.

**Auth:** Bearer  
**Rate Limit:** 60 requests / min / user  
**Permissions:** Member

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "rep_abc123",
    "callsign": "K4MIA",
    "frequency": 462.675,
    "offset": "+5.0 MHz",
    "tone": "141.3",
    "location": "Miami, FL",
    "latitude": 25.7617,
    "longitude": -80.1918,
    "status": "online",
    "owner_callsign": "K4ABC",
    "description": "Miami-Dade GMRS repeater",
    "image_url": "https://...",
    "is_favorite": false,
    "created_date": "2026-01-15T10:00:00Z"
  }
}
```

---

## POST /api/repeaters

Create a new repeater entry.

**Auth:** Bearer  
**Rate Limit:** 10 requests / hour / user  
**Permissions:** Member

**Request Body:**
```json
{
  "callsign": "K4MIA",
  "frequency": 462.675,
  "offset": "+5.0 MHz",
  "tone": "141.3",
  "location": "Miami, FL",
  "latitude": 25.7617,
  "longitude": -80.1918,
  "owner_callsign": "K4ABC",
  "description": "Miami-Dade GMRS repeater"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "rep_abc123",
    "callsign": "K4MIA",
    "frequency": 462.675,
    "created_date": "2026-07-09T14:30:00Z"
  }
}
```

---

## PUT /api/repeaters/{id}

Update a repeater. Creator or admin only.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Member (creator) or Admin

**Request Body:**
```json
{
  "status": "offline",
  "description": "Currently down for maintenance"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "rep_abc123",
    "status": "offline",
    "updated_date": "2026-07-09T14:30:00Z"
  }
}
```

---

## DELETE /api/repeaters/{id}

Delete a repeater. Creator or admin only.

**Auth:** Bearer  
**Rate Limit:** 5 requests / hour / user  
**Permissions:** Member (creator) or Admin

**Response (204):** No content

---

## POST /api/repeaters/{id}/favorite

Toggle favorite status for a repeater.

**Auth:** Bearer  
**Rate Limit:** 30 requests / min / user  
**Permissions:** Member

**Response (200):**
```json
{
  "success": true,
  "data": {
    "repeater_id": "rep_abc123",
    "is_favorite": true
  }
}
``