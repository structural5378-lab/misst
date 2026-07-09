# 13. Emergency Alerts

## POST /api/alerts

Create an emergency alert.

**Auth:** Bearer  
**Rate Limit:** 5 requests / hour / user  
**Permissions:** Moderator or Admin

**Request Body:**
```json
{
  "title": "Hurricane Warning — Category 3",
  "message": "Hurricane Bret approaching South Florida coast. All members prepare.",
  "type": "emergency",
  "link": "/weather",
  "community_id": "grp_mist"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "alt_abc123",
    "title": "Hurricane Warning — Category 3",
    "message": "Hurricane Bret approaching South Florida coast. All members prepare.",
    "type": "emergency",
    "link": "/weather",
    "created_by": "usr_abc123",
    "is_read": false,
    "broadcast_sent": true,
    "created_date": "2026-07-09T14:30:00Z"
  }
}
```

---

## GET /api/alerts

List alerts.

**Auth:** Bearer  
**Rate Limit:** 60 requests / min / user  
**Permissions:** Member

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `type` | string | null | `info`, `warning`, `emergency`, `system` |
| `unread_only` | bool | false | Filter unread only |
| `cursor` | string | null | Pagination cursor |
| `limit` | int | 20 | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "alt_abc123",
      "title": "Hurricane Warning — Category 3",
      "message": "Hurricane Bret approaching South Florida coast...",
      "type": "emergency",
      "link": "/weather",
      "is_read": false,
      "created_date": "2026-07-09T14:30:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "next_cursor": "...",
      "has_more": true,
      "limit": 20
    },
    "unread_count": 1
  }
}
```

---

## GET /api/alerts/{id}

Get a single alert.

**Auth:** Bearer  
**Rate Limit:** 60 requests / min / user  
**Permissions:** Member

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "alt_abc123",
    "title": "Hurricane Warning — Category 3",
    "message": "Hurricane Bret approaching South Florida coast. All members prepare.",
    "type": "emergency",
    "link": "/weather",
    "is_read": false,
    "acknowledged": false,
    "created_by": "usr_abc123",
    "created_date": "2026-07-09T14:30:00Z"
  }
}
```

---

## POST /api/alerts/{id}/acknowledge

Acknowledge an emergency alert.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Member

**Response (200):**
```json
{
  "success": true,
  "data": {
    "alert_id": "alt_abc123",
    "acknowledged": true,
    "acknowledged_at": "2026-07-09T14:31:00Z"
  }
}
```

---

## POST /api/alerts/subscribe

Subscribe to emergency alert push notifications.

**Auth:** Bearer  
**Rate Limit:** 5 requests / hour / user  
**Permissions:** Member

**Request Body:**
```json
{
  "device_token": "pushalert_token_abc123",
  "community_id": "grp_mist"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "subscribed": true,
    "community_id": "grp_mist"
  }
}
```

---

## DELETE /api/alerts/{id}

Delete an alert. Admin or moderator only.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Moderator or Admin

**Response (204):** No content