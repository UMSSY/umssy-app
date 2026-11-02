import { z } from 'zod';
import { MAX_MESSAGE_LENGTH } from '../constants/chat.constants.js';
import { countCharacters } from '../utils/unicode-counter.js';
import { conversationIdField } from './chat-fields.schema.js';

export const sendMessageSchema = z
  .object({
    conversationId: conversationIdField,
    content: z
      .string({ error: 'El contenido del mensaje es obligatorio' })
      .trim()
      .refine((text) => countCharacters(text) <= MAX_MESSAGE_LENGTH, {
        message: `El contenido del mensaje no puede superar los ${MAX_MESSAGE_LENGTH} caracteres`,
      })
      .optional()
      .default(''),
    attachments: z
      .array(
        z.object({
          typeId: z.string().uuid(),
          fileName: z.string(),
          mimeType: z.string(),
          fileSize: z.number(),
          fileDataBase64: z.string().optional(),
          url: z.string().optional(),
        }),
      )
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      (data.content && data.content.trim().length > 0) ||
      (data.attachments && data.attachments.length > 0),
    { message: 'El mensaje debe tener texto o un archivo adjunto' },
  );

export type SendMessageDto = z.infer<typeof sendMessageSchema>;