Tienes razón. Los otros READMEs del proyecto (el del backend, frontend y root) están escritos con un tono de documentación técnica formal, sin emojis, sin frases como "¡Bienvenido equipo!", y con secciones muy claras y concisas (Description, Project Setup, Usage, Testing, etc.).

Aquí tienes la versión final, reescrita para que encaje perfectamente con el estilo y formato de los otros READMEs del repositorio.

***

```markdown
# Notifications Module

Centralized notification service for the UMSSY backend. This module provides a single entry point (`notify()`) to dispatch notifications via Web Push, Email, and WebSockets across all platform domains.

## Architecture

This module follows a Contract-Driven approach. Responsibilities are strictly divided between the infrastructure provider (Epic 9) and the consumer modules.

*   **Consumer Modules:** Own business logic, validate payloads using Zod, and define text templates. They only send the `type`, validated `payload`, and `actionUrl`.
*   **Notifications Module (Epic 9):** Owns the delivery channels Web Push, SMTP, Socket.io, database persistence (`Notification`, `PushSubscription`), and global business rules.
*   **UI Rendering:** The Epic 9 frontend team owns the UI components and the email layout. Consumer modules do not write CSS or React components for notifications.

## Integration

To integrate this module, import `NotificationsModule` into your domain module and inject `NotificationsService` into your service.

```typescript
import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [NotificationsModule],
  providers: [YourService],
})
export class YourModule {}
```

## Usage

### 1. Notification Types

Use the exported `NotificationType` enum. Do not use raw strings. If a new type is required, coordinate with the Epic 9 team to add it to the global catalog.

```typescript
import { NotificationType } from '../notifications/types/notification-type.enum.js';
```

### 2. Payload Validation

Create a Zod schema for your event's variables within your own module. This ensures you send exactly what the template needs.

```typescript
import { z } from 'zod';

export const AppointmentBookedSchema = z.object({
  counterpartName: z.string(),
  date: z.string(),
  time: z.string(),
});
```

### 3. Dispatching Notifications

Invoke the service after your domain transaction is successful. Do not write loops for massive notifications; the engine handles batch processing.

**Single Recipient:**
```typescript
await this.notificationsService.notify({
  recipientIds: [mentorId],
  actorId: studentId,
  type: NotificationType.APPOINTMENT_BOOKED,
  payload: { counterpartName: 'Carlos', date: '2026-11-20', time: '18:00' },
  actionUrl: '/appointments/123',
});
```

**Massive (Fan-out):**
```typescript
await this.notificationsService.notify({
  recipientIds: [studentId1, studentId2, studentId3],
  type: NotificationType.SURVEY_PUBLISHED,
  payload: { surveyTitle: 'Acreditación 2026' },
  actionUrl: '/surveys/99',
});
```

## Global Rules

The `notify()` method automatically enforces the following rules. Consumer modules must not implement them:

1.  If `actorId === recipientId`, the notification is skipped.
2.  If a `ChatUserBlock` exists between the actor and recipient, the notification is skipped.
3.  Respects `pushEnabled` and `emailEnabled` per user. In-App notifications (bell) are always persisted.
4.  Push and Email subjects/bodies are truncated to 100 characters to prevent sensitive data leaks on lock screens.
5.  Uses `createMany` and `findMany` to avoid N+1 queries during massive sends.
6.  If SMTP or Web Push fails, the error is caught internally. The original business action and In-App persistence are unaffected.

## Testing

To verify your integration locally without the frontend:

1.  Ensure the `notification_types` catalog is seeded (`pnpm run seed:catalogs`).
2.  Trigger your domain action that calls `notify()`.
3.  Check the backend console. If `MAIL_TRANSPORT=console`, the rendered email will print in the terminal.
4.  Verify the database using Prisma Studio (`npx prisma studio`). The record must exist in the `Notification` table with the rendered `title` and `body`.

## Out of Scope

The following tasks are not the responsibility of consumer modules:

*   Writing templates or HTML for emails.
*   Modifying `Notification`, `PushSubscription`, or `NotificationPreference` tables directly.
*   Implementing custom Web Push logic or VAPID keys.
*   Sending notifications directly via `web-push` or `nodemailer`.
