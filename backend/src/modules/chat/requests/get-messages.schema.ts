import { z } from 'zod';

import { conversationIdField } from './chat-fields.schema.js';

export const getMessagesQuerySchema = z
  .object({
    conversationId: conversationIdField,
    cursor: z.string().uuid('El cursor no es válido').optional(),
    limit: z.coerce
      .number({ error: 'El límite debe ser un número' })
      .int('El límite debe ser un número entero')
      .min(1, 'El límite debe ser mayor o igual a 1')
      .max(50, `El límite no puede superar 50`)
      .default(20),
  })
  .strict();

export type GetMessagesQuery = z.infer<typeof getMessagesQuerySchema>;
