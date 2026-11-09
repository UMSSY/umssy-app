import { z } from 'zod';

export const rejectAccessRequestSchema = z.object({
  reason: z
    .string({ error: 'El motivo del rechazo es obligatorio' })
    .trim()
    .min(1, 'El motivo del rechazo es obligatorio')
    .max(
      500,
      `El motivo y la indicación no pueden superar los 500 caracteres en total`,
    ),
});

export type RejectAccessRequestDto = z.infer<typeof rejectAccessRequestSchema>;
