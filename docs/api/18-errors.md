# 18. Error Handling

## 18.1 Error Response Format

All errors return a consistent structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {
      "field": "email",
      "issue": "format"
    }
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-07-09T14:30:00Z"
  }
}
```

## 18.2 Error Code Reference

| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `INVALID_OTP` | 400 | OTP code invalid or expired |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token invalid |
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `ACCOUNT_UNVERIFIED` | 403 | Account not verified |
| `ACCOUNT_SUSPENDED` | 403 | Account suspended |
| `NOT_MEMBER` | 403 | Not a member of the resource |
| `GROUP_PRIVATE` | 403 | Group requires invitation |
| `USER_NOT_FOUND` | 404 | User not found |
| `RESOURCE_NOT_FOUND` | 404 | Resource not found |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `CALLSIGN_TAKEN` | 409 | Callsign already in use |
| `ALREADY_MEMBER` | 409 | Already a member |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `MAX_ATTEMPTS` | 429 | Max attempts exceeded |
| `FILE_TOO_LARGE` | 400 | File exceeds size limit |
| `INVALID_FILE_TYPE` | 400 | File type not allowed |
| `CONTENT_TOO_LONG` | 400 | Content exceeds length limit |
| `PASSWORD_TOO_WEAK` | 400 | Password doesn't meet requirements |
| `UPLOAD_FAILED` | 500 | File upload failed |
| `EXTERNAL_SERVICE_ERROR` | 502 | External service unavailable |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

## 18.3 Rate Limit Error

When rate limited, the response includes retry guidance:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Try again in 42 seconds.",
    "details": {
      "retry_after": 42,
      "limit": 30,
      "window": "minute"
    }
  }
}
```

Headers:
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1720531842
Retry-After: 42
``