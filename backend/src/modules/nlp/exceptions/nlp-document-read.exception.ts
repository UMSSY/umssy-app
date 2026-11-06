import type { NlpRejectedSource } from '../types/nlp-rejected-source.type.js';
import { NLP_VALIDATION_MESSAGES } from '../constants/nlp-validation.constants.js';
import type { NlpSourceType } from '../types/nlp-source-type.type.js';

export class NlpDocumentReadException extends Error {
  readonly source: NlpRejectedSource;

  constructor(id: string, type: NlpSourceType) {
    super('Document source could not be analyzed');
    this.name = 'NlpDocumentReadException';
    this.source = { id, type, reason: 'document-unreadable', message: NLP_VALIDATION_MESSAGES['document-unreadable'] };
  }
}
