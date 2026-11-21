# Events

## Purpose and responsibilities

The backend owns the workshop catalogue, proposal creation, cover images, managed-workshop lookup and automatic proposal expiry. The frontend owns catalogue and detail screens, the proposal form, the organizer's workshop list and the desktop-to-mobile attendance handoff. Registrations and attendance persistence belong to [event-registrations](../event-registrations/README.md); categories belong to [event-categories](../event-categories/README.md).

## Main flows and business rules

- An authenticated `titulado` submits a workshop proposal with an optional cover and idempotency key. Creating it does not immediately publish it.
- The public catalogue and detail display the state returned by the server.
- `Mis talleres` lists only published workshops whose `createdById` equals the current user ID. A new unpublished proposal does not appear. Other responsible users are not assigned by the current implementation.
- `EventsCronService` calls `EventsService.expireOverdueProposals` every five minutes; published proposals are not expired by this job.
- The organizer opens an attendance route from a listed workshop. On desktop, the screen renders a QR containing that route; the phone requires an authorized session. Check-in belongs to the registration module.

```mermaid
sequenceDiagram
    actor Organizer
    participant Frontend as Events frontend
    participant API as Events API
    participant DB as PostgreSQL
    Organizer->>Frontend: Open Mis talleres
    Frontend->>API: GET /api/events/managed (Bearer token)
    API->>DB: Find published events created by organizer
    DB-->>API: Managed workshops
    API-->>Frontend: Workshop list
    Frontend-->>Organizer: List and attendance route
```

## Dependencies

- Authentication supplies the session and `titulado` role. Server-side ownership checks authorize attendance; frontend route rules control navigation.
- Event categories supply catalogue classification and filters.
- Event registrations supplies proposal support, passes and attendance validation.
- Prisma stores events, statuses and cover metadata. Proposal expiry uses the NestJS scheduler.

## API

| Method | Path | Current use |
| --- | --- | --- |
| GET | `/api/events` | Catalogue with pagination and filters. |
| GET | `/api/events/:id` | Workshop or proposal detail. |
| POST | `/api/event-proposals` | Submit a proposal as an authenticated `titulado`; multipart form with optional cover and idempotency key. |
| GET | `/api/events/:id/cover` | Retrieve a stored cover image. |
| GET | `/api/events/managed` | Published workshops created by the authenticated `titulado`. |

Successful JSON responses use the shared API envelope. The cover endpoint returns an image stream.

## Sprint History

### Sprint 3

- Proposal expiry gained a periodic five-minute backend job independent of catalogue reads.
- The organizer flow gained `Mis talleres`, its published-owner lookup and a desktop QR link to the mobile attendance screen.
- Attendance validation remains online and is documented with the registration module.
