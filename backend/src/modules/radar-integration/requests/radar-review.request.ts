import { z } from 'zod';

// Los tipos y las decisiones se validan antes de invocar el servicio de revisión.
export const reviewKindSchema = z.enum(['cv', 'skill']);
export type ReviewKind = z.infer<typeof reviewKindSchema>;

export const reviewDecisionSchema = z
  .object({
    operationId: z.string().uuid(),
    decision: z.enum(['approved', 'rejected', 'revoked']),
  })
  .strict()
  .meta({
    example: {
      decision: 'approved',
      operationId: '22222222-2222-4222-8222-222222222222',
    },
  });
export type ReviewDecisionRequest = z.infer<typeof reviewDecisionSchema>;
export const documentReviewDecisionSchema = z
  .object({
    operationId: z.string().uuid(),
    decision: z.enum(['approved', 'rejected']),
  })
  .strict();

export type DocumentReviewDecisionRequest = z.infer<
  typeof documentReviewDecisionSchema
>;
