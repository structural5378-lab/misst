# AGENTS.md

## Cursor Cloud specific instructions

This repo is a **frontend-only** Vite + React SPA (the "MIST" GMRS radio community client, package name `base44-app`). There is no local backend in this repository; the app talks to a hosted Base44 backend and/or the MISST Core REST API at runtime. Node 22 and npm are used (lockfile: `package-lock.json`).

### Services / commands

There is a single service (the Vite dev server). Standard scripts live in `package.json`:

- Run (dev): `npm run dev` — serves on `http://localhost:5173`.
- Build: `npm run build` (Vite production build; verified working).
- Lint: `npm run lint` (`eslint . --quiet`).
- Typecheck: `npm run typecheck` (`tsc -p ./jsconfig.json`).

### Non-obvious caveats

- **No backend runs locally.** Any flow that hits the network (email/password login, registration submit, Google OAuth, entity/data fetches) requires a real hosted backend and cannot complete in this environment. Configure it via a `.env.local` (git-ignored) as described in `README.md`: `VITE_BASE44_APP_ID`, `VITE_BASE44_APP_BASE_URL` (and optionally `VITE_MIST_CORE_API_URL` to route auth/users/communities/membership to MISST Core instead of Base44 — see `src/api/mist/core/config.js`). Without these the dev server still starts and the UI renders fully; only server-backed actions fail.
- **Client-side-only features work without a backend** and are the easiest smoke tests: e.g. the Register form's password-match and GMRS call sign validation (`src/lib/gmrsCallsign.js`), and the GMRS calculator tools under `src/pages/tools/` (though tool routes sit behind `MistProtectedRoute`, which needs auth).
- Unauthenticated visits to `/` redirect to `/login` (`src/components/MistProtectedRoute.jsx`).
- `npm run lint` and `npm run typecheck` currently report **pre-existing** errors (unused imports, loose JSX prop typing) unrelated to environment setup. Build and dev are unaffected. Treat these as baseline; don't assume the env is broken because they are non-zero.
- The Vite dev server prints `[base44] Proxy not enabled (VITE_BASE44_APP_BASE_URL not set)` when no backend URL is configured — this is expected, not an error.
