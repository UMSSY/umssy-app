import { z } from 'zod';
export const verificationStatusSchema = z.enum([
  'queued',
  'reading',
  'approved',
  'review',
  'low_confidence',
  'manual_approved',
  'manual_rejected',
  'cancelled',
  'legacy',
]);
export const documentNoticeSchema = z
  .object({ status: verificationStatusSchema })
  .strict();
export const documentDecisionSchema = z
  .object({ decision: z.enum(['approved', 'rejected', 'revoke', 'reprocess']) })
  .strict();
export const documentReviewQuerySchema = z
  .object({
    filter: z
      .enum(['pending', 'approved', 'rejected', 'all'])
      .default('pending'),
  })
  .strict();
