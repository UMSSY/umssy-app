import { z } from 'zod';

export const updateMentorParticipationSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

export type UpdateMentorParticipationDto = z.infer<
  typeof updateMentorParticipationSchema
>;
