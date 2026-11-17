import type { z } from 'zod';
import type { documentDecisionSchema } from '../requests/document-verification.request.js';
export type DocumentDecisionRequest = z.infer<typeof documentDecisionSchema>;
