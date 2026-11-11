import { z } from 'zod';

// Los tipos y las decisiones se validan antes de invocar el servicio de revisión.
export const reviewKindSchema = z.enum(['cv', 'skill']);
export type ReviewKind = z.infer<typeof reviewKindSchema>;

export const reviewDecisionSchema = z
  .object({
    decision: z.enum(['approved', 'rejected', 'revoked']),
  })
  .strict();
export type ReviewDecisionRequest = z.infer<typeof reviewDecisionSchema>;
