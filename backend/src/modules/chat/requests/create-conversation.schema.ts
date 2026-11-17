import { z } from 'zod';
import { contactIdField } from './chat-fields.schema.js';

export const createConversationSchema = z
  .object({
    contactId: contactIdField,
    contextType: z.literal('POSTULACION').optional(),
    contextId: z.string().uuid().optional(),
  })
  .strict();

export type CreateConversationDto = z.infer<typeof createConversationSchema>;
