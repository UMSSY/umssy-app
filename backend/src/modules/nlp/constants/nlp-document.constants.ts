export const NLP_DOCUMENT_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  maxPages: 10,
  maxPixels: 12_000_000,
  maxDocuments: 20,
  maxQueuedExtractions: 4,
  maxCachedTexts: 32,
  timeoutMs: 30_000,
  profileTimeoutMs: 120_000,
  renderScale: 2,
} as const;

export const NLP_DOCUMENT_MIME_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg']);
export const NLP_DOCUMENT_READ_ERROR = 'Document text extraction failed or exceeded its limits';

export const NLP_OCR_LANGUAGES = ['spa', 'eng'];
export const NLP_OCR_MODEL = 'default';
export const NLP_OCR_MODEL_DIRECTORY = 'ocr-models';
