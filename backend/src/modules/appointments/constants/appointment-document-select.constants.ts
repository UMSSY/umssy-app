import type { Prisma } from '../../../prisma/client.js';

export const APPOINTMENT_DOCUMENT_METADATA_SELECT = {
  fileName: true,
  mimeType: true,
  sizeBytes: true,
  uploadedAt: true,
} satisfies Prisma.AppointmentDocumentSelect;

export const APPOINTMENT_DOCUMENT_FILE_SELECT = {
  ...APPOINTMENT_DOCUMENT_METADATA_SELECT,
  data: true,
} satisfies Prisma.AppointmentDocumentSelect;
