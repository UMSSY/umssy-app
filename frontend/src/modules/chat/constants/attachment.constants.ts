export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
] as const;

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'] as const;

export const ALLOWED_PDF_MIME_TYPES = [
  'application/pdf',
] as const;

export const ALLOWED_PDF_EXTENSIONS = ['.pdf'] as const;

export const ACCEPTED_ATTACHMENT_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_PDF_MIME_TYPES,
].join(',');

export const ATTACHMENT_ERROR_MESSAGES = {
  IMAGE_TOO_LARGE: 'La imagen supera el tamaño maximo permitido de 5 MB.',
  PDF_TOO_LARGE: 'El documento supera el tamaño maximo permitido 10 MB.',
  INVALID_FORMAT:
    'Formato no permitido, Solo puedes adjuntar imágenes (JPG, PNG) o documentos PDF.',
} as const;
