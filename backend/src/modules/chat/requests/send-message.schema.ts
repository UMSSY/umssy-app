import { z } from 'zod';
import {
  MAX_MESSAGE_LENGTH,
  MIN_MESSAGE_LENGTH,
} from '../constants/chat.constants.js';
import { conversationIdField } from './chat-fields.schema.js';
import { countCharacters } from '../utils/unicode-counter.js';

export const sendMessageSchema = z
  .object({
    conversationId: conversationIdField,
    content: z
      .string({ error: 'El contenido del mensaje es obligatorio' })
      .trim()
      .min(
        MIN_MESSAGE_LENGTH,
        'El contenido del mensaje no puede estar vacío',
      )
      .refine(
        (val) => countCharacters(val) <= MAX_MESSAGE_LENGTH,
        {
          message: `El contenido del mensaje no puede superar los ${MAX_MESSAGE_LENGTH} caracteres`,
        },
      ),
  })
  .strict();

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
