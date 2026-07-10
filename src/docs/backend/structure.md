# MIST Backend — Project Structure

Production-ready backend layout following modular monolith architecture with clean separation of concerns.

```
mist-backend/
│
├── .github/
│   └── workflows/
│       ├── ci.yml                          # Lint + test on every PR
│       ├── deploy-staging.yml              # Auto-deploy to staging on main push
│       └── deploy-production.yml           # Manual deploy to production
│
├── docker/
│   ├── Dockerfile                          # Multi-stage production build
│   ├── Dockerfile.dev                      # Development image with hot reload
│   └── docker-compose.yml                  # PostgreSQL, Redis, app
│
├── docs/
│   ├── api/                                # API specification (from Phase 2)
│   ├── database/                           # DB schema + relationships (from Phase 3)
│   ├── architecture/                       # System architecture diagrams
│   └── deployment/                         # Deployment guides
│
├── scripts/
│   ├── seed.ts                             # Seed test database
│   ├── migrate.ts                          # Run database migrations
│   ├── create-admin.ts                     # Create admin user
│   └── health-check.ts                     # Pre-deploy health verification
│
├── src/
│   │
│   ├── main.ts                              # Application entry point
│   ├── app.ts                               # Express/Fastify app configuration
│   │
│   ├── config/                             # ── CONFIGURATION ──
│   │   ├── index.ts                         # Exports merged config
│   │   ├── env.ts                           # Environment variable loader + validation
│   │   ├── database.ts                      # DB connection pool config
│   │   ├── redis.ts                         # Redis client config
│   │   ├── cors.ts                          # CORS allowed origins
│   │   ├── rate-limits.ts                   # Per-endpoint rate limit config
│   │   ├── jwt.ts                           # JWT secret, expiry, issuer
│   │   ├── oauth.ts                         # Google/Apple OAuth credentials
│   │   ├── pushalert.ts                     # PushAlert API config
│   │   ├── weather.ts                       # WeatherAPI + NOAA config
│   │   ├── mybb.ts                          # MyBB bridge config
│   │   └── schemas/                         # Zod validation schemas
│   │       ├── auth.schema.ts
│   │       ├── user.schema.ts
│   │       ├── chat.schema.ts
│   │       ├── group.schema.ts
│   │       ├── event.schema.ts
│   │       └── index.ts
│   │
│   ├── api/                                 # ── API LAYER ──
│   │   ├── index.ts                         # Mounts all route modules
│   │   ├── routes/                          # Route definitions (thin)
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── profile.routes.ts
│   │   │   ├── chat.routes.ts
│   │   │   ├── group.routes.ts
│   │   │   ├── channel.routes.ts
│   │   │   ├── image.routes.ts
│   │   │   ├── notification.routes.ts
│   │   │   ├── weather.routes.ts
│   │   │   ├── repeater.routes.ts
│   │   │   ├── map.routes.ts
│   │   │   ├── event.routes.ts
│   │   │   ├── alert.routes.ts
│   │   │   ├── ai.routes.ts
│   │   │   ├── forum.routes.ts
│   │   │   ├── feed.routes.ts
│   │   │   └── admin.routes.ts
│   │   ├── controllers/                    # Request handlers (call services)
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── profile.controller.ts
│   │   │   ├── chat.controller.ts
│   │   │   ├── group.controller.ts
│   │   │   ├── channel.controller.ts
│   │   │   ├── image.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   ├── weather.controller.ts
│   │   │   ├── repeater.controller.ts
│   │   │   ├── map.controller.ts
│   │   │   ├── event.controller.ts
│   │   │   ├── alert.controller.ts
│   │   │   ├── ai.controller.ts
│   │   │   ├── forum.controller.ts
│   │   │   ├── feed.controller.ts
│   │   │   └── admin.controller.ts
│   │   ├── middleware/                      # Cross-cutting middleware
│   │   │   ├── auth.middleware.ts           # JWT verification
│   │   │   ├── rbac.middleware.ts           # Role-based access control
│   │   │   ├── rate-limit.middleware.ts     # Per-endpoint rate limiting
│   │   │   ├── validate.middleware.ts       # Zod schema validation
│   │   │   ├── error.middleware.ts          # Global error handler
│   │   │   ├── not-found.middleware.ts      # 404 handler
│   │   │   ├── request-id.middleware.ts     # Attach request ID
│   │   │   ├── pagination.middleware.ts     # Parse cursor pagination
│   │   │   └── audit.middleware.ts          # Log admin actions
│   │   └── dto/                             # Data transfer objects
│   │       ├── auth.dto.ts
│   │       ├── user.dto.ts
│   │       ├── chat.dto.ts
│   │       ├── group.dto.ts
│   │       └── common.dto.ts                # Pagination, envelope wrappers
│   │
│   ├── services/                            # ── SERVICES (Business Logic) ──
│   │   ├── auth.service.ts                  # Register, login, OTP, refresh
│   │   ├── user.service.ts                  # User CRUD, search
│   │   ├── profile.service.ts               # Profile management
│   │   ├── friendship.service.ts           # Friend requests, accept/decline
│   │   ├── chat.service.ts                  # Message send, history, search
│   │   ├── group.service.ts                 # Group CRUD, membership
│   │   ├── channel.service.ts               # Channel management
│   │   ├── image.service.ts                 # Upload, signed URLs
│   │   ├── notification.service.ts          # Notification dispatch
│   │   ├── weather.service.ts               # Weather data, storms
│   │   ├── repeater.service.ts              # Repeater CRUD, geo-search
│   │   ├── map.service.ts                   # Location sharing, markers
│   │   ├── event.service.ts                 # Event CRUD, RSVP
│   │   ├── alert.service.ts                 # Emergency alert broadcast
│   │   ├── ai.service.ts                    # LLM moderation, translation
│   │   ├── forum.service.ts                 # Forum link management
│   │   ├── feed.service.ts                  # Aggregated activity feed
│   │   └── admin.service.ts                 # Admin operations
│   │
│   ├── repositories/                        # ── REPOSITORIES (Data Access) ──
│   │   ├── base.repository.ts               # Generic CRUD base class
│   │   ├── user.repository.ts
│   │   ├── profile.repository.ts
│   │   ├── friendship.repository.ts
│   │   ├── group.repository.ts
│   │   ├── group-member.repository.ts
│   │   ├── channel.repository.ts
│   │   ├── channel-member.repository.ts
│   │   ├── message.repository.ts
│   │   ├── message-reaction.repository.ts
│   │   ├── repeater.repository.ts
│   │   ├── weather-alert.repository.ts
│   │   ├── event.repository.ts
│   │   ├── event-rsvp.repository.ts
│   │   ├── photo.repository.ts
│   │   ├── comment.repository.ts
│   │   ├── like.repository.ts
│   │   ├── forum-link.repository.ts
│   │   ├── notification.repository.ts
│   │   ├── device-token.repository.ts
│   │   ├── permission.repository.ts
│   │   ├── audit-log.repository.ts
│   │   ├── session.repository.ts
│   │   └── api-token.repository.ts
│   │
│   ├── auth/                                # ── AUTHENTICATION ──
│   │   ├── index.ts                         # Exports auth module
│   │   ├── jwt.service.ts                   # Sign/verify JWT tokens
│   │   ├── password.service.ts             # Hash/compare passwords (argon2)
│   │   ├── otp.service.ts                   # Generate/verify OTP codes
│   │   ├── session.service.ts              # Session create/revoke/refresh
│   │   ├── oauth.service.ts                # Google/Apple OAuth flows
│   │   ├── api-token.service.ts            # Personal access tokens
│   │   ├── guards/                          # Route guards
│   │   │   ├── jwt.guard.ts
│   │   │   ├── role.guard.ts
│   │   │   └── optional-auth.guard.ts      # Public endpoints with optional auth
│   │   └── strategies/                      # Passport strategies
│   │       ├── jwt.strategy.ts
│   │       ├── google.strategy.ts
│   │       └── apple.strategy.ts
│   │
│   ├── notifications/                       # ── NOTIFICATIONS ──
│   │   ├── index.ts
│   │   ├── notification-dispatcher.ts       # Routes to correct channel
│   │   ├── channels/                        # Delivery channels
│   │   │   ├── push.channel.ts              # PushAlert push notifications
│   │   │   ├── email.channel.ts             # SendEmail integration
│   │   │   ├── in-app.channel.ts            # In-app notification entity
│   │   │   └── sms.channel.ts              # (future) SMS via Twilio
│   │   ├── templates/                       # Notification templates
│   │   │   ├── chat.template.ts
│   │   │   ├── forum.template.ts
│   │   │   ├── event.template.ts
│   │   │   ├── alert.template.ts
│   │   │   └── index.ts
│   │   ├── preferences.service.ts           # User notification preferences
│   │   └── quiet-hours.service.ts           # Quiet hours filtering
│   │
│   ├── websockets/                          # ── WEBSOCKETS ──
│   │   ├── index.ts                         # WebSocket server setup
│   │   ├── connection-manager.ts            # Track active connections
│   │   ├── rooms/                           # Room/channel management
│   │   │   ├── chat.room.ts                 # Chat message broadcasting
│   │   │   ├── presence.room.ts             # Online/typing indicators
│   │   │   ├── alert.room.ts                # Emergency alert broadcast
│   │   │   ├── location.room.ts             # Live location sharing
│   │   │   └── event.room.ts                # Event updates
│   │   ├── handlers/                        # Event handlers
│   │   │   ├── message.handler.ts
│   │   │   ├── typing.handler.ts
│   │   │   ├── presence.handler.ts
│   │   │   └── subscription.handler.ts
│   │   └── middleware/
│   │       ├── auth.ws-middleware.ts        # Authenticate WS connections
│   │       └── rate-limit.ws-middleware.ts
│   │
│   ├── media/                               # ── MEDIA ──
│   │   ├── index.ts
│   │   ├── upload.service.ts                # File upload orchestration
│   │   ├── storage/                         # Storage backends
│   │   │   ├── base.storage.ts              # Storage interface
│   │   │   ├── base44.storage.ts            # Base44 UploadFile integration
│   │   │   └── local.storage.ts             # Local dev storage
│   │   ├── image-processing.service.ts      # Resize, optimize, thumbnails
│   │   ├── signed-url.service.ts            # Time-limited signed URLs
│   │   └── validators/                      # File validation
│   │       ├── image.validator.ts           # Type, size, dimensions
│   │       └── avatar.validator.ts
│   │
│   ├── weather/                             # ── WEATHER ──
│   │   ├── index.ts
│   │   ├── weather.service.ts               # Current conditions
│   │   ├── forecast.service.ts              # Multi-day forecast
│   │   ├── storm-tracker.service.ts         # NOAA NHC cyclone tracking
│   │   ├── radar.service.ts                 # Radar/satellite imagery
│   │   ├── propagation.service.ts           # RF propagation scoring
│   │   ├── providers/                       # External weather APIs
│   │   │   ├── weatherapi.provider.ts       # WeatherAPI.com
│   │   │   ├── noaa.provider.ts             # NOAA NHC feed
│   │   │   └── base.provider.ts             # Provider interface
│   │   └── cache.service.ts                 # Weather data caching (15-min TTL)
│   │
│   ├── repeaters/                           # ── REPEATERS ──
│   │   ├── index.ts
│   │   ├── repeater.service.ts              # CRUD + geo-search
│   │   ├── repeater-book.service.ts         # RepeaterBook API sync
│   │   ├── geo-search.service.ts            # PostGIS radius queries
│   │   ├── favorite.service.ts              # User favorites
│   │   └── sync/                            # Background sync jobs
│   │       ├── repeaterbook-sync.job.ts     # Periodic RepeaterBook pull
│   │       └── status-checker.job.ts        # Repeater health checks
│   │
│   ├── maps/                                # ── MAPS ──
│   │   ├── index.ts
│   │   ├── location-share.service.ts        # Initiate/accept/end shares
│   │   ├── location-update.service.ts       # Live position updates
│   │   ├── marker.service.ts                # Custom map markers
│   │   ├── geo.service.ts                   # Haversine, geocoding helpers
│   │   └── expiry.service.ts                # Auto-expire location shares
│   │
│   ├── forum/                               # ── FORUM CONNECTOR ──
│   │   ├── index.ts
│   │   ├── forum.service.ts                 # Unified forum API
│   │   ├── connectors/                      # Pluggable forum backends
│   │   │   ├── base.connector.ts            # Connector interface
│   │   │   ├── mybb.connector.ts            # MyBB bridge adapter
│   │   │   └── native.connector.ts          # (future) Native forum
│   │   ├── thread.service.ts                # Thread listing/detail
│   │   ├── post.service.ts                  # Reply creation
│   │   ├── follow.service.ts                # Thread follow + notify
│   │   └── sync/                            # Background sync
│   │       ├── thread-sync.job.ts           # Pull new threads
│   │       └── reply-check.job.ts           # Check followed thread replies
│   │
│   ├── admin/                               # ── ADMINISTRATION ──
│   │   ├── index.ts
│   │   ├── user-admin.service.ts            # Suspend, delete, role change
│   │   ├── group-admin.service.ts           # Group moderation
│   │   ├── alert-admin.service.ts           # Emergency alert management
│   │   ├── audit.service.ts                 # Audit log queries
│   │   ├── metrics.service.ts               # System metrics/stats
│   │   └── maintenance.service.ts           # Cleanup, vacuum, reindex
│   │
│   ├── logging/                             # ── LOGGING ──
│   │   ├── index.ts
│   │   ├── logger.ts                        # Winston/pino logger instance
│   │   ├── request-logger.ts                # HTTP request/response logging
│   │   ├── audit-logger.ts                  # Audit log writer
│   │   ├── error-logger.ts                  # Structured error logging
│   │   └── transports/                      # Log destinations
│   │       ├── console.transport.ts          # Dev console output
│   │       ├── file.transport.ts            # File rotation
│   │       └── remote.transport.ts          # External log service
│   │
│   ├── db/                                  # ── DATABASE ──
│   │   ├── index.ts                         # Connection pool export
│   │   ├── pool.ts                          # pg Pool configuration
│   │   ├── client.ts                        # Transaction client helper
│   │   ├── migrations/                      # SQL migration files
│   │   │   ├── 001_create_users.sql
│   │   │   ├── 002_create_profiles.sql
│   │   │   ├── 003_create_friendships.sql
│   │   │   ├── 004_create_groups.sql
│   │   │   ├── 005_create_channels.sql
│   │   │   ├── 006_create_messages.sql
│   │   │   ├── 007_create_repeaters.sql
│   │   │   ├── 008_create_weather_alerts.sql
│   │   │   ├── 009_create_events.sql
│   │   │   ├── 010_create_photos.sql
│   │   │   ├── 011_create_comments.sql
│   │   │   ├── 012_create_likes.sql
│   │   │   ├── 013_create_forum_links.sql
│   │   │   ├── 014_create_notifications.sql
│   │   │   ├── 015_create_permissions.sql
│   │   │   ├── 016_create_audit_logs.sql
│   │   │   ├── 017_create_sessions.sql
│   │   │   ├── 018_create_api_tokens.sql
│   │   │   └── 019_create_indexes.sql
│   │   └── seeders/                         # Seed data
│   │       ├── users.seeder.ts
│   │       ├── groups.seeder.ts
│   │       ├── repeaters.seeder.ts
│   │       └── index.ts
│   │
│   ├── jobs/                                # ── BACKGROUND JOBS ──
│   │   ├── index.ts                         # Job scheduler setup
│   │   ├── scheduler.ts                     # Cron/bull queue manager
│   │   ├── notification-check.job.ts        # Consolidated notification check
│   │   ├── event-reminder.job.ts            # Event reminder dispatch
│   │   ├── weather-alert-poll.job.ts        # NOAA storm polling
│   │   ├── repeater-sync.job.ts             # RepeaterBook sync
│   │   ├── session-cleanup.job.ts           # Expired session removal
│   │   ├── token-cleanup.job.ts             # Expired API token removal
│   │   └── location-expiry.job.ts           # Expire location shares
│   │
│   ├── utils/                               # ── SHARED UTILITIES ──
│   │   ├── crypto.ts                        # Hashing, random tokens
│   │   ├── pagination.ts                    # Cursor encode/decode
│   │   ├── response.ts                      # Standard response envelope
│   │   ├── errors.ts                        # Custom error classes
│   │   ├── validators.ts                    # Shared validation helpers
│   │   ├── geo.ts                           # Haversine, distance calc
│   │   ├── time.ts                          # Timezone helpers
│   │   └── retry.ts                         # Retry with backoff
│   │
│   └── types/                               # ── SHARED TYPES ──
│       ├── express.d.ts                     # Express request augmentation
│       ├── env.d.ts                         # Environment variable types
│       └── index.ts                         # Re-exports
│
├── tests/                                   # ── TESTING ──
│   ├── unit/                                # Unit tests (isolated)
│   │   ├── services/
│   │   │   ├── auth.service.test.ts
│   │   │   ├── chat.service.test.ts
│   │   │   ├── group.service.test.ts
│   │   │   ├── weather.service.test.ts
│   │   │   └── repeater.service.test.ts
│   │   ├── repositories/
│   │   │   ├── user.repository.test.ts
│   │   │   └── message.repository.test.ts
│   │   └── utils/
│   │       ├── pagination.test.ts
│   │       └── geo.test.ts
│   ├── integration/                         # Integration tests (DB + services)
│   │   ├── auth.integration.test.ts
│   │   ├── chat.integration.test.ts
│   │   ├── forum.integration.test.ts
│   │   └── weather.integration.test.ts
│   ├── e2e/                                 # End-to-end API tests
│   │   ├── auth.e2e.test.ts
│   │   ├── users.e2e.test.ts
│   │   ├── chat.e2e.test.ts
│   │   ├── groups.e2e.test.ts
│   │   └── alerts.e2e.test.ts
│   ├── fixtures/                            # Test data factories
│   │   ├── user.fixture.ts
│   │   ├── group.fixture.ts
│   │   ├── message.fixture.ts
│   │   └── repeater.fixture.ts
│   ├── helpers/                             # Test utilities
│   │   ├── setup.ts                         # Test DB setup/teardown
│   │   ├── mock-db.ts                       # Mock database client
│   │   ├── mock-services.ts                 # Mock external services
│   │   └── api-client.ts                    # Test HTTP client
│   ├── load/                                # Load/performance tests
│   │   ├── chat-load.test.ts
│   │   └── weather-load.test.ts
│   └── jest.config.ts                       # Test configuration
│
├── .env.example                             # Environment variable template
├── .env.test                                # Test environment variables
├── .eslintrc.json                           # ESLint config
├── .prettierrc                              # Prettier config
├── tsconfig.json                            # TypeScript config
├── package.json                             # Dependencies + scripts
├── README.md                                # Project overview
└── .gitignore
```

## Architecture Principles

### Layered Architecture (top → bottom)

```
API Layer (routes → controllers → middleware)
    ↓ calls
Service Layer (business logic, orchestration)
    ↓ calls
Repository Layer (data access, SQL queries)
    ↓ talks to
Database (PostgreSQL + PostGIS)
```

**Rules:**
- Controllers never touch the database directly
- Services never return HTTP responses
- Repositories never contain business logic
- Each layer only talks to the layer directly below it

### Module Boundaries

Each domain module (`auth/`, `notifications/`, `weather/`, `repeaters/`, `maps/`, `forum/`, `media/`, `admin/`) is self-contained with its own services, providers, and jobs. Modules communicate through service interfaces, never through direct repository access.

### Dependency Injection

Services receive their dependencies (repositories, external clients) via constructor injection, making them testable and swappable.

### Configuration Management

All configuration lives in `src/config/` with environment-based loading and Zod validation. No hardcoded secrets or URLs in service code.