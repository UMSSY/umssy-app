import { z } from 'zod';

export const updateUserSkillsSchema = z.object({
  skillIds: z.array(z.uuid()).max(50),
});

export type UpdateUserSkillsRequest = z.infer<typeof updateUserSkillsSchema>;
