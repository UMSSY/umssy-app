import { z } from 'zod';
import { MAX_MESSAGE_LENGTH } from '../constants/chat.constants.js';
import { countCharacters } from '../utils/unicode-counter.js';
import { conversationIdField } from './chat-fields.schema.js';

export const sendAttachmentMessageSchema = z
  .object({
    conversationId: conversationIdField,
    content: z
      .string()
      .trim()
      .refine((text) => countCharacters(text) <= MAX_MESSAGE_LENGTH, {
        message: `El contenido del mensaje no puede superar los ${MAX_MESSAGE_LENGTH} caracteres`,
      })
      .optional()
      .default(''),
  });

export type SendAttachmentMessageDto = z.infer<typeof sendAttachmentMessageSchema>;
