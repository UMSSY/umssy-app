export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_ATTACHMENT_UPLOAD_SIZE_BYTES = MAX_PDF_SIZE_BYTES; // 10 MB máximo total permitido

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
] as const;

export const ALLOWED_PDF_MIME_TYPES = [
  'application/pdf',
] as const;

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_PDF_MIME_TYPES,
] as const;

export const ATTACHMENT_FIELD_NAME = 'file';
