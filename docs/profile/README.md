# Profile

## Purpose

The `profile` frontend module (`frontend/src/modules/profile`) shows and edits the user's profile: personal information, presentation, portfolio, completeness guide and settings. This document covers the notification settings in **Perfil → Configuración** (`/profile/settings`), where the user chooses how to receive notifications and activates push on the current device.

## Architecture

```mermaid
flowchart LR
  subgraph Profile["frontend/src/modules/profile"]
    SV[ProfileSettingsView] --> NPS[NotificationPreferencesSection]
  end
  subgraph Notifications["@/modules/notifications"]
    UNP[useNotificationPreferences]
    PSS[PushSubscriptionSync]
  end
  subgraph Shared["frontend/src/shared"]
    UPN[usePushNotifications]
    PPD[PushPermissionPromptDialog]
    PGD[PushGuideDialog]
  end
  NPS --> UNP
  NPS --> UPN
  NPS --> PPD
  NPS --> PGD
  PSS --> UPN
  UNP -->|GET/PUT /notifications/preferences| API[(Backend)]
  UPN -->|GET /push/public-key, POST /push/subscriptions| API
  UPN --> SW[sw.js service worker]
```

The section reads and saves the preference only through `useNotificationPreferences` from the public API of `@/modules/notifications`; the channel mapping belongs to that module.

## Key flows

### Choosing push on this device

```mermaid
sequenceDiagram
  actor User
  participant S as NotificationPreferencesSection
  participant D as PushPermissionPromptDialog
  participant H as usePushNotifications
  participant B as Browser
  participant API as Backend
  User->>S: Select "En el celular (Push)"
  alt iPhone below iOS 16.4, app not installed, or permission blocked
    S->>User: PushGuideDialog with the steps to follow
  else permission can be requested
    S->>D: Open the UMSSY prompt
    User->>D: "Continuar"
    D->>H: activate()
    H->>B: Notification.requestPermission()
    B-->>H: granted
    H->>B: Wait for the service worker (10 s limit)
    H->>API: GET /push/public-key
    H->>B: pushManager.subscribe()
    H->>API: POST /push/subscriptions
    API->>API: Upsert by endpoint, assigned to the current user
    H-->>S: ok
    User->>S: "Guardar cambios"
    S->>API: PUT /notifications/preferences (push)
  end
```

- "Ahora no" closes the prompt and keeps the saved preference.
- If the user blocks or dismisses the native permission, or the subscription fails, the section shows a guide or a message and does not save push.
- Push is saved only when the device has an active subscription.

### Activating push on another device

When the saved preference is already push but the current device has no subscription, the section shows "Activar en este dispositivo". It runs the same prompt and `activate()` without saving the preference again.

### Keeping the subscription after signing in again

`PushSubscriptionSync` (mounted in the app providers) runs after sign in. If the saved preference is push and the permission is already granted, it calls `sync()`, which registers the browser subscription again without asking anything. It runs again after a new sign in in the same tab. Signing out deletes the subscription of the current device only.

## Business rules

- The user chooses one external channel: "En el celular (Push)", "Solo por correo" or "Solo dentro de la app". The in-app notification bell remains enabled.
- Push is available on mobile browsers. On desktop or unsupported browsers the option is disabled.
- On iPhone, push requires iOS 16.4 or later and UMSSY installed on the home screen; otherwise the corresponding guide is shown.
- A browser subscription that was registered by another account on the same device is reassigned to the account that activates push.

## Endpoints

### Consumed

| Method | Route                          | Usage                                   |
| ------ | ------------------------------ | --------------------------------------- |
| GET    | `/notifications/preferences`   | Saved channel                           |
| PUT    | `/notifications/preferences`   | Saves the chosen channel                |
| GET    | `/push/public-key`             | VAPID key to create the subscription    |
| POST   | `/push/subscriptions`          | Registers the device subscription       |
| DELETE | `/push/subscriptions`          | Removes the device subscription on sign out |

## Dependencies

| Direction | Module                                        | Usage                                                           |
| --------- | --------------------------------------------- | --------------------------------------------------------------- |
| Uses      | [notifications](../notifications/README.md)   | `useNotificationPreferences` and the preference endpoints       |
| Uses      | shared                                        | `usePushNotifications`, push prompt and guide dialogs, `sw.js`  |

## Sprint History

### Sprint 3

- Selecting push opens the UMSSY prompt first and the native permission only after "Continuar".
- Guides for blocked permission, iPhone below iOS 16.4 and app not installed on iPhone.
- "Activar en este dispositivo" registers push on a new device without changing the saved preference.
- The device subscription is registered again after signing in, through `PushSubscriptionSync`.
- The section uses `useNotificationPreferences` from `@/modules/notifications`; the duplicated profile hook was removed.
