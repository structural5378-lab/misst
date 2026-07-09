# 1. Conventions

## 1.1 Authentication

All endpoints (except auth endpoints) require a Bearer token:

```
Authorization: Bearer <access_token>
```

Tokens are JWTs issued by the Auth module. Access tokens are short-lived (15 min). Refresh tokens are long-lived (30 days) and stored server-side in `AuthSession`.

## 1.2 Roles & Permissions

| Role | Scope |
|---|---|
| `admin` | Full access — all modules, user management, system config |
| `moderator` | Community-scoped moderation — chat, forum, alerts, member management |
| `member` | Standard access — own data, community participation, read public data |
| `guest` | Unauthenticated — register, login, public repeater/weather read-only |

## 1.3 Standard Response Envelope

All responses use a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-07-09T14:30:00Z"
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": { "field": "email" }
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-07-09T14:30:00Z"
  }
}
```

## 1.4 Pagination

Cursor-based pagination for all list endpoints:

**Request:**
```
GET /api/users?cursor=<encoded_cursor>&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "pagination": {
      "cursor": "eyJpZCI6IjEyMyJ9",
      "next_cursor": "eyJpZCI6IjEyNCJ9",
      "has_more": true,
      "limit": 50
    }
  }
}
```

## 1.5 HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | OK — request succeeded |
| 201 | Created — resource created |
| 204 | No Content — success, no body |
| 400 | Bad Request — validation error |
| 401 | Unauthorized — missing/invalid token |
| 403 | Forbidden — insufficient permissions |
| 404 | Not Found — resource doesn't exist |
| 409 | Conflict — duplicate resource |
| 422 | Unprocessable Entity — semantic validation error |
| 429 | Too Many Requests — rate limit exceeded |
| 500 | Internal Server Error — server fault |
| 503 | Service Unavailable — dependency failure |

## 1.6 Field Naming

- Request/response fields: `snake_case`
- Timestamps: ISO 8601 UTC (`2026-07-09T14:30:00Z`)
- IDs: string (UUID or entity ID)
- Booleans: `true` / `false