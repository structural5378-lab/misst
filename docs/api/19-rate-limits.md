# 19. Rate Limits

## 19.1 Global Rate Limits

| Tier | Limit | Window |
|---|---|---|
| Authenticated | 300 requests | per minute |
| Unauthenticated | 60 requests | per minute |

## 19.2 Per-Endpoint Rate Limits

| Endpoint | Limit | Window | Scope |
|---|---|---|---|
| `POST /auth/register` | 5 | 10 min | IP |
| `POST /auth/login` | 5 | 10 min | IP |
| `POST /auth/verify-otp` | 10 | 10 min | user |
| `POST /auth/resend-otp` | 3 | 10 min | email |
| `POST /auth/refresh` | 30 | hour | user |
| `POST /auth/password/reset-request` | 3 | hour | email |
| `GET /auth/me` | 60 | min | user |
| `GET /users` | 30 | min | user |
| `GET /users/{id}` | 60 | min | user |
| `PUT /users/{id}` | 10 | min | user |
| `DELETE /users/{id}` | 3 | hour | user |
| `POST /users/invite` | 10 | hour | user |
| `GET /profiles/{userId}` | 60 | min | user |
| `PUT /profiles/{userId}` | 10 | min | user |
| `POST /profiles/{userId}/avatar` | 5 | hour | user |
| `POST /chat/conversations` | 10 | min | user |
| `GET /chat/conversations` | 30 | min | user |
| `GET /chat/conversations/{id}/messages` | 60 | min | user |
| `POST /chat/conversations/{id}/messages` | 30 | min | user |
| `DELETE /chat/messages/{id}` | 30 | min | user |
| `POST /chat/messages/{id}/reactions` | 60 | min | user |
| `POST /chat/typing` | 20 | min | user |
| `GET /chat/search` | 10 | min | user |
| `POST /groups` | 3 | hour | user |
| `GET /groups` | 30 | min | user |
| `GET /groups/{id}` | 60 | min | user |
| `PUT /groups/{id}` | 10 | min | user |
| `DELETE /groups/{id}` | 1 | hour | user |
| `GET /groups/{id}/members` | 30 | min | user |
| `POST /groups/{id}/join` | 10 | min | user |
| `POST /groups/{id}/leave` | 10 | min | user |
| `POST /groups/{id}/invite` | 20 | hour | user |
| `PUT /groups/{id}/members/{userId}/role` | 10 | min | user |
| `POST /images/upload` | 30 | hour | user |
| `GET /images/{id}/signed-url` | 60 | min | user |
| `DELETE /images/{id}` | 10 | min | user |
| `GET /notifications` | 60 | min | user |
| `POST /notifications/mark-read` | 30 | min | user |
| `POST /notifications/mark-all-read` | 5 | min | user |
| `POST /notifications/device-token` | 10 | hour | user |
| `PUT /notifications/preferences` | 10 | min | user |
| `GET /weather` | 30 | min | user |
| `GET /weather/storms` | 10 | min | user |
| `GET /weather/radar` | 30 | min | user |
| `GET /repeaters` | 30 | min | user |
| `GET /repeaters/{id}` | 60 | min | user |
| `POST /repeaters` | 10 | hour | user |
| `PUT /repeaters/{id}` | 10 | min | user |
| `DELETE /repeaters/{id}` | 5 | hour | user |
| `POST /repeaters/{id}/favorite` | 30 | min | user |
| `POST /maps/share` | 10 | min | user |
| `GET /maps/shares` | 30 | min | user |
| `POST /maps/shares/{id}/accept` | 10 | min | user |
| `POST /maps/shares/{id}/decline` | 10 | min | user |
| `POST /maps/shares/{id}/end` | 10 | min | user |
| `POST /maps/shares/{id}/update` | 60 | min | user |
| `POST /maps/markers` | 10 | min | user |
| `GET /maps/markers` | 30 | min | user |
| `POST /events` | 10 | hour | user |
| `GET /events` | 30 | min | user |
| `GET /events/{id}` | 60 | min | user |
| `PUT /events/{id}` | 10 | min | user |
| `DELETE /events/{id}` | 5 | hour | user |
| `POST /events/{id}/rsvp` | 10 | min | user |
| `POST /alerts` | 5 | hour | user |
| `GET /alerts` | 60 | min | user |
| `GET /alerts/{id}` | 60 | min | user |
| `POST /alerts/{id}/acknowledge` | 10 | min | user |
| `POST /alerts/subscribe` | 5 | hour | user |
| `DELETE /alerts/{id}` | 10 | min | user |
| `POST /ai/moderate` | 30 | min | user |
| `POST /ai/translate` | 20 | min | user |
| `POST /ai/assist` | 10 | min | user |
| `POST /ai/summarize` | 10 | min | user |
| `POST /ai/chat` | 10 | min | user |
| `GET /forum/categories` | 30 | min | user |
| `GET /forum/categories/{id}/threads` | 30 | min | user |
| `GET /forum/threads/{id}` | 30 | min | user |
| `POST /forum/threads` | 10 | hour | user |
| `POST /forum/threads/{id}/replies` | 20 | hour | user |
| `POST /forum/threads/{id}/follow` | 20 | min | user |
| `DELETE /forum/threads/{id}/follow` | 20 | min | user |
| `GET /feed` | 30 | min | user |

## 19.3 Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 28
X-RateLimit-Reset: 1720531842
``