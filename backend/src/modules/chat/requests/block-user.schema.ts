import { z } from 'zod';

export const blockUserIdField = z
    .string({ error: 'El identificador del usuario es obligatorio' })
    .uuid('El identificador del usuario no es válido');

export const blockUserSchema = z
    .object({
        userId: blockUserIdField,
     })
     .strict();

export type BlockUserDto = z.infer<typeof blockUserSchema>;