import { z } from 'zod';

export const eventRoomJoinSchema = z
  .object({
    registrationId: z
      .string({ error: 'El ID de la inscripción es obligatorio' })
      .uuid('El ID de la inscripción no es válido'),
  })
  .strict();

export type EventRoomJoinDto = z.infer<typeof eventRoomJoinSchema>;
