import { z } from 'zod';
import { createCertificationSchema } from './create-certification.request.js';

export const saveCertificationDocumentSchema = createCertificationSchema.extend({
  documentAction: z.enum(['replace', 'remove', 'keep']),
});

export type SaveCertificationDocumentRequest = z.infer<typeof saveCertificationDocumentSchema>;
