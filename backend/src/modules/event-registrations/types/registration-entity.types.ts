import type { EventRegistrationsService } from '../services/event-registrations.service.js';

export type RegistrationEntity = Awaited<
  ReturnType<EventRegistrationsService['findByUserId']>
>[number];
