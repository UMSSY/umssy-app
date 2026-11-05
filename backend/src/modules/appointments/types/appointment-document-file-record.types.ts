import type { Prisma } from '../../../prisma/client.js';
import type { APPOINTMENT_DOCUMENT_FILE_SELECT } from '../constants/appointment-document-select.constants.js';

export type AppointmentDocumentFileRecord =
  Prisma.AppointmentDocumentGetPayload<{
    select: typeof APPOINTMENT_DOCUMENT_FILE_SELECT;
  }>;
