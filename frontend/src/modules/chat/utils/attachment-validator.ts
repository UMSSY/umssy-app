import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_PDF_EXTENSIONS,
  ALLOWED_PDF_MIME_TYPES,
  ATTACHMENT_ERROR_MESSAGES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_PDF_SIZE_BYTES,
} from '../constants/attachment.constants';

export type AttachmentType = 'image' | 'pdf';

export type AttachmentValidationResult =
  | { valid: true; type: AttachmentType }
  | { valid: false; error: string };

export function isAllowedImage(file: File): boolean {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  return (
    ALLOWED_IMAGE_MIME_TYPES.includes(
      mime as (typeof ALLOWED_IMAGE_MIME_TYPES)[number],
    ) || ALLOWED_IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext))
  );
}

export function isAllowedPdf(file: File): boolean {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  return (
    ALLOWED_PDF_MIME_TYPES.includes(
      mime as (typeof ALLOWED_PDF_MIME_TYPES)[number],
    ) || ALLOWED_PDF_EXTENSIONS.some((ext) => name.endsWith(ext))
  );
}

export function validateAttachmentFile(file: File): AttachmentValidationResult {
  const isImage = isAllowedImage(file);
  const isPdf = isAllowedPdf(file);

  if (!isImage && !isPdf) {
    return {
      valid: false,
      error: ATTACHMENT_ERROR_MESSAGES.INVALID_FORMAT,
    };
  }

  if (isImage) {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return {
        valid: false,
        error: ATTACHMENT_ERROR_MESSAGES.IMAGE_TOO_LARGE,
      };
    }
    return { valid: true, type: 'image' };
  }

  if (isPdf) {
    if (file.size > MAX_PDF_SIZE_BYTES) {
      return {
        valid: false,
        error: ATTACHMENT_ERROR_MESSAGES.PDF_TOO_LARGE,
      };
    }
    return { valid: true, type: 'pdf' };
  }

  return {
    valid: false,
    error: ATTACHMENT_ERROR_MESSAGES.INVALID_FORMAT,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1).replace(/\.0$/, '')} MB`;
}
