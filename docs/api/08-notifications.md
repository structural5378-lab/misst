# 8. Notifications

## GET /api/notifications

List notifications for the current user.

**Auth:** Bearer  
**Rate Limit:** 60 requests / min / user  
**Permissions:** Member

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `cursor` | string | null | Pagination cursor |
| `limit` | int | 20 | Items per page |
| `unread_only` | bool | false | Filter unread only |
| `type` | string | null | Filter by type |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ntf_abc123",
      "type": "chat",
      "title": "New message from Sarah",
      "message": "Hey, are you on the net tonight?",
      "link": "/live-chat",
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
    "unread_count": 5
  }
}
```

---

## POST /api/notifications/mark-read

Mark specific notifications as read.

**Auth:** Bearer  
**Rate Limit:** 30 requests / min / user  
**Permissions:** Member

**Request Body:**
```json
{
  "notification_ids": ["ntf_abc123", "ntf_def456"]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "marked_count": 2
  }
}
```

---

## POST /api/notifications/mark-all-read

Mark all notifications as read.

**Auth:** Bearer  
**Rate Limit:** 5 requests / min / user  
**Permissions:** Member

**Response (200):**
```json
{
  "success": true,
  "data": {
    "marked_count": 5
  }
}
```

---

## POST /api/notifications/device-token

Register a device for push notifications.

**Auth:** Bearer  
**Rate Limit:** 10 requests / hour / user  
**Permissions:** Member

**Request Body:**
```json
{
  "token": "pushalert_token_abc123",
  "platform": "web",
  "device_name": "iPhone 15 Pro"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "device_id": "dev_abc123",
    "registered": true
  }
}
```

---

## PUT /api/notifications/preferences

Update notification preferences.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Member

**Request Body:**
```json
{
  "chat_messages": true,
  "forum_replies": true,
  "event_reminders": true,
  "emergency_alerts": true,
  "location_requests": true,
  "quiet_hours": {
    "enabled": false,
    "start": "22:00",
    "end": "07:00"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "chat_messages": true,
    "forum_replies": true,
    "event_reminders": true,
    "emergency_alerts": true,
    "location_requests": true,
    "quiet_hours": {
      "enabled": false,
      "start": "22:00",
      "end": "07:00"
    }
  }
}
``