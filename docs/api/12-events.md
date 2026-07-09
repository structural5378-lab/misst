# 12. Events

## POST /api/events

Create a new event.

**Auth:** Bearer  
**Rate Limit:** 10 requests / hour / user  
**Permissions:** Member

**Request Body:**
```json
{
  "title": "Monthly MIST Net",
  "description": "Monthly check-in net for all MIST members",
  "event_time": "2026-07-15T20:00:00Z",
  "location": "Repeater K4MIA — 462.675",
  "community_id": "grp_mist"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "evt_abc123",
    "title": "Monthly MIST Net",
    "description": "Monthly check-in net for all MIST members",
    "event_time": "2026-07-15T20:00:00Z",
    "location": "Repeater K4MIA — 462.675",
    "created_by": "usr_abc123",
    "status": "upcoming",
    "rsvp_count": 0,
    "created_date": "2026-07-09T14:30:00Z"
  }
}
```

---

## GET /api/events

List events.

**Auth:** Bearer  
**Rate Limit:** 30 requests / min / user  
**Permissions:** Member

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `status` | string | `upcoming` | `upcoming`, `active`, `ended`, `delayed` |
| `community_id` | string | null | Filter by community |
| `cursor` | string | null | Pagination cursor |
| `limit` | int | 20 | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "evt_abc123",
      "title": "Monthly MIST Net",
      "event_time": "2026-07-15T20:00:00Z",
      "location": "Repeater K4MIA — 462.675",
      "status": "upcoming",
      "rsvp_count": 23,
      "created_by": "usr_abc123"
    }
  ],
  "meta": {
    "pagination": {
      "next_cursor": "...",
      "has_more": true,
      "limit": 20
    }
  }
}
```

---

## GET /api/events/{id}

Get a single event.

**Auth:** Bearer  
**Rate Limit:** 60 requests / min / user  
**Permissions:** Member

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "evt_abc123",
    "title": "Monthly MIST Net",
    "description": "Monthly check-in net for all MIST members",
    "event_time": "2026-07-15T20:00:00Z",
    "location": "Repeater K4MIA — 462.675",
    "created_by": "usr_abc123",
    "status": "upcoming",
    "rsvp_count": 23,
    "my_rsvp": null,
    "created_date": "2026-07-09T14:30:00Z"
  }
}
```

---

## PUT /api/events/{id}

Update an event. Creator or admin only.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Member (creator) or Admin

**Request Body:**
```json
{
  "title": "Monthly MIST Net — Rescheduled",
  "event_time": "2026-07-16T20:00:00Z",
  "status": "delayed",
  "delayed_until": "2026-07-16T20:00:00Z"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "evt_abc123",
    "title": "Monthly MIST Net — Rescheduled",
    "status": "delayed",
    "updated_date": "2026-07-09T14:30:00Z"
  }
}
```

---

## DELETE /api/events/{id}

Delete an event. Creator or admin only.

**Auth:** Bearer  
**Rate Limit:** 5 requests / hour / user  
**Permissions:** Member (creator) or Admin

**Response (204):** No content

---

## POST /api/events/{id}/rsvp

RSVP to an event.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Member

**Request Body:**
```json
{
  "status": "attending"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "event_id": "evt_abc123",
    "user_id": "usr_abc123",
    "status": "attending",
    "rsvp_count": 24
  }
}
``