# 7. Images

## POST /api/images/upload

Upload an image file.

**Auth:** Bearer  
**Rate Limit:** 30 requests / hour / user  
**Permissions:** Member

**Request Body:** `multipart/form-data`
```
file: <binary image data>
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "file_url": "https://media.base44.com/...",
    "file_size": 245678,
    "mime_type": "image/jpeg"
  }
}
```

**Errors:**
| Code | Status | Message |
|---|---|---|
| `FILE_TOO_LARGE` | 400 | File exceeds 10MB limit |
| `INVALID_FILE_TYPE` | 400 | Only image files allowed |
| `UPLOAD_FAILED` | 500 | Upload failed — try again |

---

## GET /api/images/{id}/signed-url

Get a time-limited signed URL for a private image.

**Auth:** Bearer  
**Rate Limit:** 60 requests / min / user  
**Permissions:** Member

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `expires_in` | int | 300 | URL expiry in seconds (max 3600) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "signed_url": "https://media.base44.com/signed/...",
    "expires_at": "2026-07-09T14:35:00Z"
  }
}
```

---

## DELETE /api/images/{id}

Delete an uploaded image. Owner or admin only.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Member (owner) or Admin

**Response (204):** No content