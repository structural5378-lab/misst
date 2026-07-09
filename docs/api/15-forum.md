# 15. Forum Integration

## GET /api/forum/categories

List forum categories.

**Auth:** Bearer  
**Rate Limit:** 30 requests / min / user  
**Permissions:** Member

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat_abc123",
      "name": "General Discussion",
      "description": "General GMRS topics",
      "icon": "radio",
      "thread_count": 145,
      "sort_order": 1
    }
  ]
}
```

---

## GET /api/forum/categories/{id}/threads

List threads in a category.

**Auth:** Bearer  
**Rate Limit:** 30 requests / min / user  
**Permissions:** Member

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `cursor` | string | null | Pagination cursor |
| `limit` | int | 20 | Items per page |
| `sort` | string | `last_reply` | `last_reply`, `created`, `replies` |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "thr_abc123",
      "title": "Best GMRS radio for beginners?",
      "body": "I'm new to GMRS and looking for recommendations...",
      "category_id": "cat_abc123",
      "category_name": "General Discussion",
      "author_name": "John Smith",
      "author_callsign": "WQABC123",
      "reply_count": 12,
      "view_count": 234,
      "is_pinned": false,
      "is_read": false,
      "last_reply_date": "2026-07-09T14:00:00Z",
      "created_date": "2026-07-08T10:00:00Z"
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

## GET /api/forum/threads/{id}

Get a single thread with posts.

**Auth:** Bearer  
**Rate Limit:** 30 requests / min / user  
**Permissions:** Member

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Post page number |
| `limit` | int | 20 | Posts per page |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "thr_abc123",
    "title": "Best GMRS radio for beginners?",
    "body": "I'm new to GMRS and looking for recommendations...",
    "category_id": "cat_abc123",
    "category_name": "General Discussion",
    "author_name": "John Smith",
    "author_callsign": "WQABC123",
    "reply_count": 12,
    "view_count": 235,
    "is_pinned": false,
    "is_followed": true,
    "posts": [
      {
        "id": "pst_abc123",
        "body": "I'd recommend the Wouxun KG-1000G for beginners...",
        "author_name": "Sarah Jones",
        "author_callsign": "WQDEF456",
        "created_date": "2026-07-08T11:00:00Z"
      }
    ],
    "created_date": "2026-07-08T10:00:00Z"
  }
}
```

---

## POST /api/forum/threads

Create a new thread.

**Auth:** Bearer  
**Rate Limit:** 10 requests / hour / user  
**Permissions:** Member

**Request Body:**
```json
{
  "title": "Best GMRS radio for beginners?",
  "body": "I'm new to GMRS and looking for recommendations...",
  "category_id": "cat_abc123",
  "community_id": "grp_mist"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "thr_abc123",
    "title": "Best GMRS radio for beginners?",
    "category_id": "cat_abc123",
    "author_name": "John Smith",
    "reply_count": 0,
    "view_count": 0,
    "created_date": "2026-07-09T14:30:00Z"
  }
}
```

---

## POST /api/forum/threads/{id}/replies

Reply to a thread.

**Auth:** Bearer  
**Rate Limit:** 20 requests / hour / user  
**Permissions:** Member

**Request Body:**
```json
{
  "body": "I'd recommend the Wouxun KG-1000G for beginners..."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "pst_abc123",
    "thread_id": "thr_abc123",
    "body": "I'd recommend the Wouxun KG-1000G for beginners...",
    "author_name": "Sarah Jones",
    "created_date": "2026-07-09T14:30:00Z"
  }
}
```

---

## POST /api/forum/threads/{id}/follow

Follow a thread for notifications.

**Auth:** Bearer  
**Rate Limit:** 20 requests / min / user  
**Permissions:** Member

**Response (200):**
```json
{
  "success": true,
  "data": {
    "thread_id": "thr_abc123",
    "is_followed": true
  }
}
```

---

## DELETE /api/forum/threads/{id}/follow

Unfollow a thread.

**Auth:** Bearer  
**Rate Limit:** 20 requests / min / user  
**Permissions:** Member

**Response (200):**
```json
{
  "success": true,
  "data": {
    "thread_id": "thr_abc123",
    "is_followed": false
  }
}
``