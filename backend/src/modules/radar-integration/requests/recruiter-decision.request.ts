import { z } from 'zod';

export const recruiterDecisionSchema = z
  .object({
    decision: z.enum(['hired', 'rejected']),
  })
  .strict();
