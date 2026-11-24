# Auth Module

## Overview

The **Auth Module** provides authentication, cookie-first session management, Google OAuth verification/linking, refresh token rotation with replay detection, password recovery via OTP, password history enforcement, and cross-tab session inactivity protection across backend (`NestJS`) and frontend (`Next.js`).

Browser clients authenticate through **HttpOnly cookies** (`umssy_access`, `umssy_refresh`) paired with a lightweight session presence indicator (`umssy_has_session`), while API clients can also send standard `Authorization: Bearer <jwt>` headers.

## API Endpoints

| Method | Route                          | Auth             | Description                                                                        |
| ------ | ------------------------------ | ---------------- | ---------------------------------------------------------------------------------- |
| `GET`  | `/auth/session`                | JWT / Cookie     | Returns active session identity, roles, optional company info, and idle/abs limits |
| `POST` | `/auth/login`                  | Public           | Authenticates credentials, issues session cookies (`umssy_access`, `umssy_refresh`) |
| `POST` | `/auth/google/login`           | Public           | Verifies Google ID token and establishes an authenticated cookie session           |
| `POST` | `/auth/google/link`            | JWT / Cookie     | Links a Google account to the authenticated user                                   |
| `POST` | `/auth/refresh`                | Cookie / Body    | Rotates refresh token family, rejects reused tokens, reissues session cookies      |
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
      AuthCtrl-->>ApiClient: Set rotated umssy_access + umssy_refresh cookies
      ApiClient->>AuthCtrl: Retry original request cleanly (stale Bearer stripped)
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
- **Cookie-First Session State**: `AuthProvider` performs a single `GET /auth/session` query when authenticated via Bearer token, `hasCookieSession()`, or `umssy_has_session` marker, passing session timings directly as props to `SessionInactivityGuard`.
- **Browser Storage Discipline**: Non-sensitive session user identity for offline/idempotency isolation is persisted in IndexedDB (`umssy:session:current-user-id`), never `sessionStorage`; JWT secrets are never written to `localStorage` or `IndexedDB`.
- **Cross-Tab Synchronization**: `useSessionInactivity` synchronizes user activity across open tabs via throttled `BroadcastChannel` (`ACTIVITY` events) and `localStorage` (`umssy_last_activity_at` + `storage` listener), preventing premature timeout and dismissing warning modals when another tab is active. Session termination (`SESSION_CLOSED`) logs out all open tabs in lockstep.

## Sprint History

### Sprint 3
- Unified browser authentication around `HttpOnly` session cookies (`umssy_access`, `umssy_refresh`), WebSocket cookie authentication, single-flight refresh rotation retry in `apiClient`, and IndexedDB session identity isolation.
- Added cross-tab inactivity synchronization via `BroadcastChannel` and `localStorage` (`umssy_last_activity_at`), removed duplicate `/auth/session` polling in `SessionInactivityGuard`, and normalized credential cooldown error handling.
