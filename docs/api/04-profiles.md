# 4. Profiles

## GET /api/profiles/{userId}

Get a user's public profile.

**Auth:** Bearer  
**Rate Limit:** 60 requests / min / user  
**Permissions:** Member

**Path Parameters:**
| Param | Type | Description |
|---|---|---|
| `userId` | string | User ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user_id": "usr_abc123",
    "callsign": "WQABC123",
    "license_id": "WRQD12345678901",
    "bio": "GMRS enthusiast in South Florida",
    "location": "Miami, FL",
    "latitude": 25.7617,
    "longitude": -80.1918,
    "avatar_url": "https://...",
    "radio_gear": ["Baofeng UV-5R", "Wouxun KG-1000G"],
    "social_links": {
      "website": "https://...",
      "youtube": "https://..."
    },
    "stats": {
      "messages_sent": 1247,
      "nets_attended": 23,
      "events_attended": 5,
      "member_since": "2026-01-15T10:00:00Z"
    }
  }
}
```

---

## PUT /api/profiles/{userId}

Update profile. Users can only update their own profile.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Member (self)

**Request Body:**
```json
{
  "bio": "GMRS enthusiast in South Florida",
  "location": "Miami, FL",
  "latitude": 25.7617,
  "longitude": -80.1918,
  "radio_gear": ["Baofeng UV-5R", "Wouxun KG-1000G"],
  "social_links": {
    "website": "https://..."
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user_id": "usr_abc123",
    "bio": "GMRS enthusiast in South Florida",
    "updated_date": "2026-07-09T14:30:00Z"
  }
}
```

---

## POST /api/profiles/{userId}/avatar

Upload profile avatar.

**Auth:** Bearer  
**Rate Limit:** 5 requests / hour / user  
**Permissions:** Member (self)

**Request Body:** `multipart/form-data`
```
file: <binary image data>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "avatar_url": "https://media.base44.com/..."
  }
}
```

**Errors:**
| Code | Status | Message |
|---|---|---|
| `FILE_TOO_LARGE` | 400 | File exceeds 5MB limit |
| `INVALID_FILE_TYPE` | 400 | Only image files allowed |