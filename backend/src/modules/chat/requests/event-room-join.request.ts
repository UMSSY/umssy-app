import { z } from 'zod';

export const eventRoomJoinSchema = z
  .object({
    eventId: z.string().uuid('El ID del evento no es válido'),
  })
  .strict();

export type EventRoomJoinDto = z.infer<typeof eventRoomJoinSchema>;