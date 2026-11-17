import { z } from 'zod';
export const documentDecisionSchema = z
  .object({ decision: z.enum(['approved', 'rejected', 'reprocess', 'revoke']) })
  .strict();
export const documentAcknowledgementSchema = z
  .object({
    status: z.enum([
      'queued',
      'reading',
      'approved',
      'review',
      'low_confidence',
      'manual_approved',
      'manual_rejected',
      'legacy',
      'cancelled',
    ]),
  })
  .strict();
export const documentReviewFilterSchema = z
  .enum(['pending', 'approved', 'rejected', 'all'])
  .default('pending');

export type DocumentAcknowledgementRequest = z.infer<
  typeof documentAcknowledgementSchema
>;

export type DocumentReviewFilter = z.infer<
  typeof documentReviewFilterSchema
>;
