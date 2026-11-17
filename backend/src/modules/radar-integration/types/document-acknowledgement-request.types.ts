import type { z } from 'zod';
import type { documentAcknowledgementSchema } from '../requests/document-verification.request.js';
export type DocumentAcknowledgementRequest = z.infer<
  typeof documentAcknowledgementSchema
>;
