import type { Request } from 'express';
import type { DocumentCorrectionContext } from './document-correction.types.js';

export interface DocumentCorrectionRequest extends Request {
  documentCorrection?: DocumentCorrectionContext;
}
