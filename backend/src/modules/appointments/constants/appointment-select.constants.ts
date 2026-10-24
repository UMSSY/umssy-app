import type { Prisma } from '../../../prisma/client.js';

export const APPOINTMENT_SELECT = {
  id: true,
  blockId: true,
  mentorId: true,
  studentId: true,
  startAt: true,
  endAt: true,
  mentor: { select: { id: true, firstName: true, lastName: true } },
  student: { select: { id: true, firstName: true, lastName: true } },
  orientationType: { select: { id: true, name: true } },
  status: { select: { title: true } },
} satisfies Prisma.AppointmentSelect;
