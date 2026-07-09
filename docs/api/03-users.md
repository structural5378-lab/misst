# 3. Users

## GET /api/users

List users with pagination and search.

**Auth:** Bearer  
**Rate Limit:** 30 requests / min / user  
**Permissions:** Member

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `cursor` | string | null | Pagination cursor |
| `limit` | int | 50 | Items per page (max 100) |
| `search` | string | null | Search username/callsign |
| `role` | string | null | Filter by role |
| `community_id` | string | null | Filter by community |
| `online` | bool | null | Filter online users only |
| `sort` | string | `created_date` | Sort field |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "usr_abc123",
      "full_name": "John Smith",
      "callsign": "WQABC123",
      "avatar_url": "https://...",
      "role": "member",
      "community_name": "MIST",
      "is_online": true,
      "created_date": "2026-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "next_cursor": "eyJpZCI6IjEyNCJ9",
      "has_more": true,
      "limit": 50
    }
  }
}
```

---

## GET /api/users/{id}

Get a single user.

**Auth:** Bearer  
**Rate Limit:** 60 requests / min / user  
**Permissions:** Member

**Path Parameters:**
| Param | Type | Description |
|---|---|---|
| `id` | string | User ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "full_name": "John Smith",
    "callsign": "WQABC123",
    "email": "user@example.com",
    "avatar_url": "https://...",
    "role": "member",
    "community_id": "grp_mist",
    "community_name": "MIST",
    "is_online": true,
    "created_date": "2026-01-15T10:00:00Z"
  }
}
```

**Errors:**
| Code | Status | Message |
|---|---|---|
| `USER_NOT_FOUND` | 404 | User not found |

---

## PUT /api/users/{id}

Update user. Users can only update their own account unless admin.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Member (self) or Admin (any)

**Request Body:**
```json
{
  "full_name": "John Smith Jr.",
  "callsign": "WQABC456"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "full_name": "John Smith Jr.",
    "callsign": "WQABC456",
    "updated_date": "2026-07-09T14:30:00Z"
  }
}
```

**Errors:**
| Code | Status | Message |
|---|---|---|
| `FORBIDDEN` | 403 | Cannot edit another user's account |
| `CALLSIGN_TAKEN` | 409 | Callsign already in use |

---

## DELETE /api/users/{id}

Delete user account. Admin only for other users.

**Auth:** Bearer  
**Rate Limit:** 3 requests / hour / user  
**Permissions:** Member (self) or Admin (any)

**Response (204):** No content

---

## POST /api/users/invite

Invite a user to the platform.

**Auth:** Bearer  
**Rate Limit:** 10 requests / hour / user  
**Permissions:** Admin

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "role": "member"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "invite_id": "inv_abc123",
    "email": "newuser@example.com",
    "role": "member",
    "expires_at": "2026-07-16T14:30:00Z"
  }
}
``