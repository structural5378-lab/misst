# 2. Authentication

## POST /api/auth/register

Create a new account. Does not log the user in — requires OTP verification.

**Auth:** None  
**Rate Limit:** 5 requests / 10 min / IP  
**Permissions:** Guest

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Smith",
  "callsign": "WQABC123"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user_id": "usr_abc123",
    "email": "user@example.com",
    "verification_required": true,
    "otp_sent_to": "user@example.com"
  }
}
```

**Errors:**
| Code | Status | Message |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Email format invalid |
| `PASSWORD_TOO_WEAK` | 400 | Password must be 8+ chars with 1 number |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `CALLSIGN_TAKEN` | 409 | Callsign already in use |

---

## POST /api/auth/verify-otp

Verify OTP code and complete registration.

**Auth:** None  
**Rate Limit:** 10 requests / 10 min / user  
**Permissions:** Guest

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp_code": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "rt_abc123",
    "expires_in": 900,
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "full_name": "John Smith",
      "role": "member"
    }
  }
}
```

**Errors:**
| Code | Status | Message |
|---|---|---|
| `INVALID_OTP` | 400 | Invalid or expired OTP |
| `MAX_ATTEMPTS` | 429 | Too many attempts — OTP invalidated |

---

## POST /api/auth/resend-otp

Resend OTP verification code.

**Auth:** None  
**Rate Limit:** 3 requests / 10 min / email  
**Permissions:** Guest

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "otp_sent_to": "user@example.com"
  }
}
```

---

## POST /api/auth/login

Authenticate with email + password.

**Auth:** None  
**Rate Limit:** 5 requests / 10 min / IP  
**Permissions:** Guest

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "rt_abc123",
    "expires_in": 900,
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "full_name": "John Smith",
      "callsign": "WQABC123",
      "role": "member",
      "avatar_url": "https://..."
    }
  }
}
```

**Errors:**
| Code | Status | Message |
|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Invalid email or password |
| `ACCOUNT_UNVERIFIED` | 403 | Account not verified — check email for OTP |
| `ACCOUNT_SUSPENDED` | 403 | Account suspended |

---

## POST /api/auth/refresh

Exchange refresh token for new access token.

**Auth:** None (refresh token in body)  
**Rate Limit:** 30 requests / hour / user  
**Permissions:** Guest

**Request Body:**
```json
{
  "refresh_token": "rt_abc123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOi...",
    "expires_in": 900
  }
}
```

**Errors:**
| Code | Status | Message |
|---|---|---|
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token invalid or expired |
| `SESSION_REVOKED` | 401 | Session has been revoked |

---

## POST /api/auth/logout

Invalidate current session.

**Auth:** Bearer  
**Rate Limit:** 10 requests / hour / user  
**Permissions:** Member

**Request Body:**
```json
{
  "refresh_token": "rt_abc123"
}
```

**Response (204):** No content

---

## POST /api/auth/password/reset-request

Request password reset email.

**Auth:** None  
**Rate Limit:** 3 requests / hour / email  
**Permissions:** Guest

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "If an account exists, a reset link has been sent."
  }
}
```

> Always returns success — does not reveal whether email exists.

---

## POST /api/auth/password/reset

Reset password using reset token.

**Auth:** None  
**Rate Limit:** 5 requests / hour / token  
**Permissions:** Guest

**Request Body:**
```json
{
  "reset_token": "rt_reset_abc123",
  "new_password": "NewSecurePass456!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset successful."
  }
}
```

---

## GET /api/auth/oauth/{provider}

Initiate OAuth login flow.

**Auth:** None  
**Rate Limit:** 10 requests / hour / IP  
**Permissions:** Guest

**Path Parameters:**
| Param | Type | Values |
|---|---|---|
| `provider` | string | `google`, `apple` |

**Response (302):** Redirect to provider OAuth URL

---

## GET /api/auth/oauth/{provider}/callback

OAuth callback handler.

**Auth:** None  
**Rate Limit:** 10 requests / hour / IP  
**Permissions:** Guest

**Query Parameters:**
| Param | Type | Description |
|---|---|---|
| `code` | string | OAuth authorization code |
| `state` | string | CSRF state token |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "rt_abc123",
    "expires_in": 900,
    "user": { ... }
  }
}
```

---

## GET /api/auth/me

Get current authenticated user.

**Auth:** Bearer  
**Rate Limit:** 60 requests / min / user  
**Permissions:** Member

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "full_name": "John Smith",
    "callsign": "WQABC123",
    "role": "member",
    "avatar_url": "https://...",
    "created_date": "2026-01-15T10:00:00Z",
    "community_id": "grp_mist",
    "community_name": "MIST"
  }
}
``