import type { Prisma } from '../../../prisma/client.js';
import type { APPOINTMENT_DOCUMENT_METADATA_SELECT } from '../constants/appointment-document-select.constants.js';

export type AppointmentDocumentMetadataRecord =
  Prisma.AppointmentDocumentGetPayload<{
    select: typeof APPOINTMENT_DOCUMENT_METADATA_SELECT;
  }>;
