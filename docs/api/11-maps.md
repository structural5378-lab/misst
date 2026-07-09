# 11. Maps

## POST /api/maps/share

Initiate a location share request.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Member

**Request Body:**
```json
{
  "target_user_id": "usr_def456",
  "initiator_lat": 25.7617,
  "initiator_lon": -80.1918,
  "duration_minutes": 30
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "loc_abc123",
    "initiator_id": "usr_abc123",
    "target_id": "usr_def456",
    "status": "pending",
    "expires_at": "2026-07-09T15:00:00Z"
  }
}
```

---

## GET /api/maps/shares

List location shares for the current user.

**Auth:** Bearer  
**Rate Limit:** 30 requests / min / user  
**Permissions:** Member

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `status` | string | `active` | `pending`, `active`, `declined`, `ended` |
| `role` | string | null | `initiator` or `target` |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "loc_abc123",
      "initiator_id": "usr_abc123",
      "initiator_name": "John Smith",
      "initiator_avatar": "https://...",
      "initiator_lat": 25.7617,
      "initiator_lon": -80.1918,
      "target_id": "usr_def456",
      "target_name": "Sarah Jones",
      "target_lat": null,
      "target_lon": null,
      "status": "active",
      "expires_at": "2026-07-09T15:00:00Z"
    }
  ]
}
```

---

## POST /api/maps/shares/{id}/accept

Accept a location share request.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Member (target only)

**Request Body:**
```json
{
  "lat": 25.7841,
  "lng": -80.1342
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "loc_abc123",
    "status": "active",
    "target_lat": 25.7841,
    "target_lon": -80.1342
  }
}
```

---

## POST /api/maps/shares/{id}/decline

Decline a location share request.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Member (target only)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "loc_abc123",
    "status": "declined"
  }
}
```

---

## POST /api/maps/shares/{id}/end

End an active location share.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Member (initiator or target)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "loc_abc123",
    "status": "ended"
  }
}
```

---

## POST /api/maps/shares/{id}/update

Update current position in an active share.

**Auth:** Bearer  
**Rate Limit:** 60 requests / min / user  
**Permissions:** Member (initiator or target)

**Request Body:**
```json
{
  "lat": 25.7620,
  "lng": -80.1915
}
```

**Response (204):** No content

---

## POST /api/maps/markers

Add a custom map marker.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Member

**Request Body:**
```json
{
  "label": "Meetup Point",
  "lat": 25.7617,
  "lng": -80.1918,
  "type": "meetup",
  "description": "Monthly meetup location"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "mk_abc123",
    "label": "Meetup Point",
    "lat": 25.7617,
    "lng": -80.1918,
    "type": "meetup",
    "created_by": "usr_abc123"
  }
}
```

---

## GET /api/maps/markers

List map markers.

**Auth:** Bearer  
**Rate Limit:** 30 requests / min / user  
**Permissions:** Member

**Query Parameters:**
| Param | Type | Description |
|---|---|---|
| `lat` | float | Center latitude |
| `lng` | float | Center longitude |
| `radius` | int | Radius in miles |
| `type` | string | Filter by marker type |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "mk_abc123",
      "label": "Meetup Point",
      "lat": 25.7617,
      "lng": -80.1918,
      "type": "meetup",
      "description": "Monthly meetup location",
      "created_by": "usr_abc123"
    }
  ]
}
``