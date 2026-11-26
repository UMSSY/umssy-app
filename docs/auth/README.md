# Auth Module

## Overview

The **Auth Module** provides authentication, cookie-first session management, Google OAuth verification/linking, refresh token rotation with replay detection, password recovery via OTP, password history enforcement, and cross-tab session inactivity protection across backend (`NestJS`) and frontend (`Next.js`).

Browser clients authenticate through **HttpOnly cookies** (`umssy_access`, `umssy_refresh`) paired with a lightweight session presence indicator (`umssy_has_session`), while API clients can also send standard `Authorization: Bearer <jwt>` headers. Sign-in and password recovery use institutional primary buttons with the shared button shape, and signing out uses a standard neutral confirmation.

## API Endpoints

| Method | Route                          | Auth             | Description                                                                        |
| ------ | ------------------------------ | ---------------- | ---------------------------------------------------------------------------------- |
| `GET`  | `/auth/session`                | JWT / Cookie     | Returns active session identity, roles, optional company info, and idle/abs limits |
| `POST` | `/auth/login`                  | Public           | Authenticates credentials, issues session cookies (`umssy_access`, `umssy_refresh`) |
| `POST` | `/auth/google/login`           | Public           | Verifies Google ID token and establishes an authenticated cookie session           |
| `POST` | `/auth/google/link`            | JWT / Cookie     | Links a Google account to the authenticated user                                   |
| `POST` | `/auth/refresh`                | Cookie / Body    | Rotates refresh token family, rejects reused tokens, sets rotated cookies & returns session credentials |
| `POST` | `/auth/logout`                 | Public / Session | Revokes active refresh token family and clears session cookies                     |
| `POST` | `/auth/forgot-password/request`| Public           | Dispatches password recovery OTP with credential rate-limit enforcement             |
| `POST` | `/auth/forgot-password/verify` | Public           | Verifies recovery OTP code and attempt limits                                      |
| `POST` | `/auth/forgot-password/reset`  | Public           | Resets password, checks recent password history, and revokes active refresh chains |

Account activation (`POST /account-activation`) also sets `umssy_access` and `umssy_refresh` via `AuthSessionCookieService`.

## Session Lifecycle & Refresh Rotation

```mermaid
sequenceDiagram
  autonumber
  participant Browser
  participant ApiClient as Frontend ApiClient
  participant AuthCtrl as AuthController
  participant RefreshSvc as RefreshTokenService
  participant DB as PostgreSQL

  Browser->>ApiClient: Protected API request
  ApiClient->>AuthCtrl: Request (withCredentials: true, umssy_access cookie)
  alt Access cookie expired (401)
    AuthCtrl-->>ApiClient: 401 Unauthorized
    ApiClient->>AuthCtrl: Single-flight POST /auth/refresh (umssy_refresh cookie)
    AuthCtrl->>RefreshSvc: Validate and rotate refresh token
    RefreshSvc->>DB: Check token_hash, used_at, revoked_at, absolute_expires_at
    alt Replay detected (used_at set)
      RefreshSvc->>DB: Revoke entire family_id
      AuthCtrl-->>ApiClient: 401 REFRESH_INVALID (clear session cookies)
      ApiClient-->>Browser: Broadcast SESSION_CLOSED across tabs
    else Valid token within absolute cap
      RefreshSvc->>DB: Mark old token used & store replacement hash
      AuthCtrl-->>ApiClient: 200 OK { accessToken, roleTag, roles } + rotated cookies
      ApiClient->>ApiClient: Apply refreshed credential before resolving success
      ApiClient->>AuthCtrl: Retry original request cleanly (stale Bearer suppressed)
      AuthCtrl-->>Browser: 200 OK
    end
  end
```

## Architecture Notes

### Backend (`backend/src/modules/auth`)
- **Cookie & Bearer Extraction**: REST guards and shared WebSocket gateways (`chat`, `notifications`) extract credentials from `Authorization: Bearer` headers or the `umssy_access` cookie using shared `extractSocketAccessToken` and `SOCKET_CORS_CONFIG`.
- **Single Source Session Timing**: `/auth/session` emits `idleTimeoutSeconds`, `warningSeconds`, and `absoluteExpiresAt` computed from the active refresh family.
- **Security Controls**: Credential attempt tracking enforces per-account temporary cooldowns on login and OTP recovery; `PasswordHistory` prevents reusing recent password hashes.

### Frontend (`frontend/src/modules/auth` & `frontend/src/shared`)
- **Cookie-First Hydration & Session State**: When client storage starts without an in-memory credential or local cookie marker, `SessionGate` invokes `AuthProvider.hydrateSession()` (`GET /auth/session`) before redirecting to `/login`, ensuring browser reloads preserve active `HttpOnly` cookie sessions. `AuthProvider` passes server-computed inactivity limits directly as props to `SessionInactivityGuard`.
- **Unified Single-Flight Refresh**: Auto-refresh, interactive "Seguir conectado" renewal (`useSessionInactivity`), and `apiClient` 401 recovery converge on one shared single-flight refresh operation (`executeSharedRefresh` / `authService.refreshSession`) that applies the refreshed credential before reporting success. If renewal fails, `useSessionInactivity` keeps the warning modal open so the user can retry or close the session.
- **Responsive Warning Dialog**: `SessionTimeoutModal` constrains height via `max-h-editor-dialog overflow-y-auto` so warning text and action buttons remain reachable on low-height mobile landscape screens.
- **UI & Logout Standards**: Login and password recovery use institutional primary buttons (`bg-primary`, without legacy `.institutional-button`), and signing out uses neutral action styling.
- **Browser Storage Discipline**: Non-sensitive session user identity for offline/idempotency isolation is persisted in IndexedDB (`umssy:session:current-user-id`), never `sessionStorage`; JWT secrets are never written to `localStorage` or `IndexedDB`.
- **Cross-Tab Synchronization**: `useSessionInactivity` synchronizes user activity across open tabs via throttled `BroadcastChannel` (`ACTIVITY` events) and `localStorage` (`umssy_last_activity_at` + `storage` listener), preventing premature timeout and dismissing warning modals when another tab is active. Session termination (`SESSION_CLOSED`) logs out all open tabs in lockstep.

See the [Prisma schema](../../backend/prisma/schema.prisma) for the model definitions and the [database README](../../backend/prisma/README.md) for database relationships.

## Sprint History

### Sprint 3
- Unified browser authentication around `HttpOnly` session cookies (`umssy_access`, `umssy_refresh`), WebSocket cookie authentication, single-flight refresh rotation retry in `apiClient`, and IndexedDB session identity isolation.
- Added `AuthProvider.hydrateSession()` probe in `SessionGate` for reload persistence, unified `/auth/refresh` credential application across API retries and `useSessionInactivity`, kept the inactivity warning modal open on refresh failure, and constrained `SessionTimeoutModal` height for landscape viewports.
- Added cross-tab inactivity synchronization via `BroadcastChannel` and `localStorage` (`umssy_last_activity_at`), removed duplicate `/auth/session` polling in `SessionInactivityGuard`, and normalized credential cooldown error handling.
