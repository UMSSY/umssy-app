import { RadarDocumentStatus } from '../constants/radar-document-status.enum.js';
import { z } from 'zod';
import { documentReviewDecisionSchema } from './radar-review.request.js';
export const documentDecisionSchema = z
  .union([
    documentReviewDecisionSchema,
    z.object({ decision: z.enum(['reprocess', 'revoke']) }).strict(),
  ])
  .meta({
    example: {
      decision: 'approved',
      operationId: '22222222-2222-4222-8222-222222222222',
    },
  });
export const documentAcknowledgementSchema = z
  .object({
    status: z.enum([
      RadarDocumentStatus.QUEUED,
      RadarDocumentStatus.READING,
      RadarDocumentStatus.APPROVED,
      RadarDocumentStatus.REVIEW,
      RadarDocumentStatus.LOW_CONFIDENCE,
      RadarDocumentStatus.MANUAL_APPROVED,
      RadarDocumentStatus.MANUAL_REJECTED,
      RadarDocumentStatus.LEGACY,
      RadarDocumentStatus.CANCELLED,
    ]),
  })
  .strict()
  .meta({ example: { status: 'approved' } });
export const documentReviewFilterSchema = z
  .enum(['pending', 'approved', 'rejected', 'all'])
  .default('pending');
