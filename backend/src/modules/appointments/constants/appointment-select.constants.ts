import type { Prisma } from '../../../prisma/client.js';
import { APPOINTMENT_DOCUMENT_METADATA_SELECT } from './appointment-document-select.constants.js';

export const APPOINTMENT_SELECT = {
  id: true,
  blockId: true,
  mentorId: true,
  studentId: true,
  startAt: true,
  endAt: true,
  message: true,
  requestedAt: true,
  meetingUrl: true,
  mentor: { select: { id: true, firstName: true, lastName: true } },
  student: { select: { id: true, firstName: true, lastName: true } },
  orientationType: { select: { id: true, name: true } },
  status: { select: { title: true } },
  document: { select: APPOINTMENT_DOCUMENT_METADATA_SELECT },
} satisfies Prisma.AppointmentSelect;
