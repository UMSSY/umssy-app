import { RadarDocumentStatus } from '../constants/radar-document-status.enum.js';
import { z } from 'zod';
export const documentDecisionSchema = z
  .object({
    decision: z.enum(['approved', 'rejected', 'reprocess', 'revoke']),
  })
  .strict()
  .meta({ example: { decision: 'approved' } });
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
