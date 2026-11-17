import type { z } from 'zod';
import type { documentReviewFilterSchema } from '../requests/document-verification.request.js';
export type DocumentReviewFilter = z.infer<typeof documentReviewFilterSchema>;
