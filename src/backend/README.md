# MIST Backend

Production-ready backend for the MIST GMRS communications platform.

## Architecture

Modular monolith with layered architecture:

```
API Layer (routes → controllers → middleware)
    ↓
Service Layer (business logic)
    ↓
Repository Layer (data access)
    ↓
Database (PostgreSQL + PostGIS)
```

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

## Project Structure

See [structure.md](../../docs/backend/structure.md) for the complete folder layout.

## Key Modules

| Module | Path | Description |
|---|---|---|
| API | `src/api/` | Routes, controllers, middleware, DTOs |
| Services | `src/services/` | Business logic layer |
| Repositories | `src/repositories/` | Data access layer |
| Auth | `src/auth/` | JWT, passwords, OTP, OAuth, sessions |
| Notifications | `src/notifications/` | Multi-channel notification dispatch |
| WebSockets | `src/websockets/` | Real-time connection management |
| Media | `src/media/` | File upload, storage, image processing |
| Weather | `src/weather/` | Weather data, storms, radar |
| Repeaters | `src/repeaters/` | Repeater directory, geo-search |
| Maps | `src/maps/` | Location sharing, markers |
| Forum | `src/forum/` | MyBB connector (swappable) |
| Admin | `src/admin/` | Administration tools |
| Logging | `src/logging/` | Structured logging |
| Config | `src/config/` | Environment + validation |
| Jobs | `src/jobs/` | Background job scheduler |
| DB | `src/db/` | Connection pool, migrations, seeders |
| Tests | `tests/` | Unit, integration, e2e, load tests |

## Scripts

```bash
npm run dev          # Start with hot reload
npm run build        # Compile TypeScript
npm run start        # Start production server
npm run migrate      # Run database migrations
npm run seed         # Seed test database
npm run test         # Run all tests
npm run test:unit    # Unit tests only
npm run test:e2e     # E2E tests only
npm run lint         # ESLint
npm run format       # Prettier format
``