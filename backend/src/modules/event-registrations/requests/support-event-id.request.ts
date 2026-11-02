import { z } from 'zod';

export const SupportEventIdSchema = z.guid({
  message: 'eventId debe ser un UUID válido',
});