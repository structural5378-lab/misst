# 6. Groups

## POST /api/groups

Create a new group/community.

**Auth:** Bearer  
**Rate Limit:** 3 requests / hour / user  
**Permissions:** Member

**Request Body:**
```json
{
  "name": "Insomniacs GMRS",
  "callsign": "MIST",
  "description": "South Florida GMRS community",
  "logo_url": "https://...",
  "primary_color": "#8B5CF6",
  "is_public": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "grp_mist",
    "name": "Insomniacs GMRS",
    "callsign": "MIST",
    "description": "South Florida GMRS community",
    "logo_url": "https://...",
    "primary_color": "#8B5CF6",
    "founder_id": "usr_abc123",
    "founder_name": "John Smith",
    "member_count": 1,
    "is_active": true,
    "created_date": "2026-07-09T14:30:00Z"
  }
}
```

---

## GET /api/groups

List groups.

**Auth:** Bearer  
**Rate Limit:** 30 requests / min / user  
**Permissions:** Member

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `cursor` | string | null | Pagination cursor |
| `limit` | int | 20 | Items per page |
| `search` | string | null | Search by name/callsign |
| `is_public` | bool | true | Filter public groups |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "grp_mist",
      "name": "Insomniacs GMRS",
      "callsign": "MIST",
      "logo_url": "https://...",
      "member_count": 145,
      "is_active": true
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

## GET /api/groups/{id}

Get a single group.

**Auth:** Bearer  
**Rate Limit:** 60 requests / min / user  
**Permissions:** Member

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "grp_mist",
    "name": "Insomniacs GMRS",
    "callsign": "MIST",
    "description": "South Florida GMRS community",
    "logo_url": "https://...",
    "primary_color": "#8B5CF6",
    "founder_id": "usr_abc123",
    "founder_name": "John Smith",
    "member_count": 145,
    "is_active": true,
    "is_public": true,
    "created_date": "2026-01-15T10:00:00Z"
  }
}
```

---

## PUT /api/groups/{id}

Update group. Group admin or moderator only.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Group Admin or Moderator

**Request Body:**
```json
{
  "name": "Insomniacs GMRS Updated",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "grp_mist",
    "name": "Insomniacs GMRS Updated",
    "updated_date": "2026-07-09T14:30:00Z"
  }
}
```

---

## DELETE /api/groups/{id}

Delete a group. Group founder or platform admin only.

**Auth:** Bearer  
**Rate Limit:** 1 request / hour / user  
**Permissions:** Group Founder or Admin

**Response (204):** No content

---

## GET /api/groups/{id}/members

List group members.

**Auth:** Bearer  
**Rate Limit:** 30 requests / min / user  
**Permissions:** Member

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `cursor` | string | null | Pagination cursor |
| `limit` | int | 50 | Items per page |
| `role` | string | null | Filter by role |
| `online` | bool | null | Filter online only |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "user_id": "usr_abc123",
      "user_name": "John Smith",
      "user_callsign": "WQABC123",
      "user_avatar": "https://...",
      "role": "admin",
      "is_online": true,
      "joined_date": "2026-01-15T10:00:00Z"
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

## POST /api/groups/{id}/join

Join a public group.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Member

**Response (200):**
```json
{
  "success": true,
  "data": {
    "group_id": "grp_mist",
    "user_id": "usr_abc123",
    "role": "member",
    "joined_date": "2026-07-09T14:30:00Z"
  }
}
```

**Errors:**
| Code | Status | Message |
|---|---|---|
| `ALREADY_MEMBER` | 409 | Already a member of this group |
| `GROUP_PRIVATE` | 403 | Group requires invitation |

---

## POST /api/groups/{id}/leave

Leave a group.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Member

**Response (204):** No content

---

## POST /api/groups/{id}/invite

Invite a user to a group.

**Auth:** Bearer  
**Rate Limit:** 20 requests / hour / user  
**Permissions:** Group Admin or Moderator

**Request Body:**
```json
{
  "user_id": "usr_def456",
  "role": "member"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "invite_id": "ginv_abc123",
    "group_id": "grp_mist",
    "user_id": "usr_def456",
    "role": "member",
    "status": "pending"
  }
}
```

---

## PUT /api/groups/{id}/members/{userId}/role

Update a member's role.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Group Admin

**Request Body:**
```json
{
  "role": "moderator"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user_id": "usr_def456",
    "role": "moderator",
    "updated_date": "2026-07-09T14:30:00Z"
  }
}
``