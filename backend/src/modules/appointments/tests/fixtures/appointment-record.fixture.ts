import type { AppointmentRecord } from '../../types/appointment-record.types.js';

export const MENTOR_ID = '11111111-1111-4111-8111-111111111111';
export const STUDENT_ID = '22222222-2222-4222-8222-222222222222';
export const OTHER_USER_ID = '33333333-3333-4333-8333-333333333333';
export const APPOINTMENT_ID = '44444444-4444-4444-8444-444444444444';
export const NOW = new Date('2026-10-22T15:00:00.000Z');

export function createAppointmentRecord(
  overrides: Partial<AppointmentRecord> = {},
): AppointmentRecord {
  return {
    id: APPOINTMENT_ID,
    blockId: '55555555-5555-4555-8555-555555555555',
    mentorId: MENTOR_ID,
    studentId: STUDENT_ID,
    startAt: new Date('2026-10-23T14:00:00.000Z'),
    endAt: new Date('2026-10-23T14:30:00.000Z'),
    mentor: { id: MENTOR_ID, firstName: 'Ana', lastName: 'Pérez' },
    student: { id: STUDENT_ID, firstName: 'Luis', lastName: 'Flores' },
    orientationType: {
      id: '66666666-6666-4666-8666-666666666666',
      name: 'Orientación profesional',
    },
    status: { title: 'CONFIRMED' },
    ...overrides,
  };
}
