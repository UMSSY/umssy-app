import { z } from 'zod';

export const updateMentorCapacitySchema = z
  .object({
    percentage: z.number().int().min(1).max(100),
  })
  .strict();

export type UpdateMentorCapacityDto = z.infer<
  typeof updateMentorCapacitySchema
>;
