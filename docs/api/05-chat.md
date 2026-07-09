# 5. Chat

## POST /api/chat/conversations

Create a new conversation.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Member

**Request Body:**
```json
{
  "type": "group",
  "name": "MIST Net Control Team",
  "community_id": "grp_mist",
  "member_ids": ["usr_abc123", "usr_def456"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "conv_abc123",
    "type": "group",
    "name": "MIST Net Control Team",
    "community_id": "grp_mist",
    "created_by": "usr_abc123",
    "member_count": 3,
    "created_date": "2026-07-09T14:30:00Z"
  }
}
```

---

## GET /api/chat/conversations

List conversations for the current user.

**Auth:** Bearer  
**Rate Limit:** 30 requests / min / user  
**Permissions:** Member

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `cursor` | string | null | Pagination cursor |
| `limit` | int | 20 | Items per page |
| `community_id` | string | null | Filter by community |
| `type` | string | null | `direct`, `group`, `channel`, `emergency` |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "conv_abc123",
      "type": "group",
      "name": "MIST Live Chat",
      "avatar_url": "https://...",
      "community_id": "grp_mist",
      "member_count": 45,
      "last_message_preview": "Anyone monitoring 462.675?",
      "last_message_at": "2026-07-09T14:29:00Z",
      "unread_count": 3,
      "is_pinned": false,
      "is_muted": false
    }
  ],
  "meta": {
    "pagination": {
      "next_cursor": "eyJpZCI6...",
      "has_more": true,
      "limit": 20
    }
  }
}
```

---

## GET /api/chat/conversations/{id}/messages

Get messages in a conversation (paginated).

**Auth:** Bearer  
**Rate Limit:** 60 requests / min / user  
**Permissions:** Member (must be conversation member)

**Path Parameters:**
| Param | Type | Description |
|---|---|---|
| `id` | string | Conversation ID |

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `cursor` | string | null | Pagination cursor (message ID) |
| `limit` | int | 50 | Messages per page (max 100) |
| `direction` | string | `before` | `before` or `after` cursor |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg_abc123",
      "conversation_id": "conv_abc123",
      "sender_id": "usr_abc123",
      "sender_name": "John Smith",
      "sender_avatar": "https://...",
      "content": "Anyone monitoring 462.675?",
      "image_url": null,
      "reply_to_id": null,
      "reactions": {
        "👍": ["usr_def456"],
        "❤️": ["usr_ghi789"]
      },
      "created_date": "2026-07-09T14:29:00Z",
      "updated_date": "2026-07-09T14:29:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "next_cursor": "eyJpZCI6Im1zZ19hYmMxMjQifQ==",
      "has_more": true,
      "limit": 50
    }
  }
}
```

---

## POST /api/chat/conversations/{id}/messages

Send a message to a conversation.

**Auth:** Bearer  
**Rate Limit:** 30 requests / min / user  
**Permissions:** Member (must be conversation member)

**Path Parameters:**
| Param | Type | Description |
|---|---|---|
| `id` | string | Conversation ID |

**Request Body:**
```json
{
  "content": "Anyone monitoring 462.675?",
  "image_url": null,
  "reply_to_id": "msg_abc122"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "msg_abc123",
    "conversation_id": "conv_abc123",
    "sender_id": "usr_abc123",
    "sender_name": "John Smith",
    "content": "Anyone monitoring 462.675?",
    "created_date": "2026-07-09T14:30:00Z"
  }
}
```

**Errors:**
| Code | Status | Message |
|---|---|---|
| `NOT_MEMBER` | 403 | Not a member of this conversation |
| `RATE_LIMITED` | 429 | Slow down — 30 messages per minute |
| `CONTENT_TOO_LONG` | 400 | Message exceeds 5000 characters |

---

## DELETE /api/chat/messages/{id}

Delete a message. Users can delete their own messages; moderators can delete any.

**Auth:** Bearer  
**Rate Limit:** 30 requests / min / user  
**Permissions:** Member (own) or Moderator (any)

**Response (204):** No content

---

## POST /api/chat/messages/{id}/reactions

Toggle a reaction on a message.

**Auth:** Bearer  
**Rate Limit:** 60 requests / min / user  
**Permissions:** Member

**Request Body:**
```json
{
  "emoji": "👍"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message_id": "msg_abc123",
    "reactions": {
      "👍": ["usr_abc123", "usr_def456"]
    }
  }
}
```

---

## POST /api/chat/typing

Broadcast typing indicator.

**Auth:** Bearer  
**Rate Limit:** 20 requests / min / user  
**Permissions:** Member

**Request Body:**
```json
{
  "conversation_id": "conv_abc123"
}
```

**Response (204):** No content

---

## GET /api/chat/search

Search messages across conversations.

**Auth:** Bearer  
**Rate Limit:** 10 requests / min / user  
**Permissions:** Member

**Query Parameters:**
| Param | Type | Description |
|---|---|---|
| `q` | string | Search query |
| `conversation_id` | string | Limit to conversation |
| `limit` | int | Results per page (max 50) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg_abc123",
      "conversation_id": "conv_abc123",
      "content": "Anyone monitoring 462.675?",
      "sender_name": "John Smith",
      "created_date": "2026-07-09T14:30:00Z"
    }
  ]
}
``