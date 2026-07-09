# 16. Feed

## GET /api/feed

Get the aggregated activity feed for the current user.

**Auth:** Bearer  
**Rate Limit:** 30 requests / min / user  
**Permissions:** Member

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `cursor` | string | null | Pagination cursor |
| `limit` | int | 20 | Items per page |
| `community_id` | string | null | Filter by community |
| `types` | string | null | Comma-separated: `chat,forum,event,alert` |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "feed_abc123",
      "type": "forum",
      "title": "New reply in 'Best GMRS radio for beginners?'",
      "preview": "I'd recommend the Wouxun KG-1000G...",
      "author_name": "Sarah Jones",
      "author_avatar": "https://...",
      "link": "/forums/thread/thr_abc123",
      "community_name": "MIST",
      "created_date": "2026-07-09T14:30:00Z"
    },
    {
      "id": "feed_def456",
      "type": "event",
      "title": "Monthly MIST Net starting in 2 hours",
      "preview": "Monthly check-in net for all MIST members",
      "author_name": "John Smith",
      "author_avatar": "https://...",
      "link": "/events/evt_abc123",
      "community_name": "MIST",
      "created_date": "2026-07-09T14:00:00Z"
    },
    {
      "id": "feed_ghi789",
      "type": "chat",
      "title": "New message in MIST Live Chat",
      "preview": "Anyone monitoring 462.675?",
      "author_name": "John Smith",
      "author_avatar": "https://...",
      "link": "/live-chat",
      "community_name": "MIST",
      "created_date": "2026-07-09T14:29:00Z"
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
``