import { z } from 'zod';
import { activateMentorSchema } from './activate-mentor.schema.js';

export const createMentorParticipationSchema = activateMentorSchema;

export type CreateMentorParticipationDto = z.infer<
  typeof createMentorParticipationSchema
>;
