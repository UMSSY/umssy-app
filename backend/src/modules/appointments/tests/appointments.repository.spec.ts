import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { APPOINTMENT_SELECT } from '../constants/appointment-select.constants.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';
import {
  APPOINTMENT_ID,
  createAppointmentRecord,
  MENTOR_ID,
  NOW,
} from './fixtures/appointment-record.fixture.js';

describe('AppointmentsRepository', () => {
  const findMany = vi.fn();
  const findUnique = vi.fn();
  let repository: AppointmentsRepository;

  beforeEach(() => {
    vi.resetAllMocks();
    repository = new AppointmentsRepository({
      appointment: { findMany, findUnique },
    } as unknown as PrismaService);
  });

  it('filters upcoming confirmed appointments by either participant and the strict end boundary', async () => {
    const records = [createAppointmentRecord()];
    findMany.mockResolvedValue(records);

    await expect(repository.findMine(MENTOR_ID, 'upcoming', NOW)).resolves.toBe(
      records,
    );
    expect(findMany).toHaveBeenCalledExactlyOnceWith({
      where: {
        OR: [{ mentorId: MENTOR_ID }, { studentId: MENTOR_ID }],
        status: { title: { in: ['CONFIRMED', 'CONFIRMADA'] } },
        endAt: { gt: NOW },
      },
      orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
      select: APPOINTMENT_SELECT,
    });
  });

  it('includes the exact end boundary in past and orders by latest finish with stable tie breaks', async () => {
    findMany.mockResolvedValue([]);

    await expect(repository.findMine(MENTOR_ID, 'past', NOW)).resolves.toEqual(
      [],
    );
    expect(findMany).toHaveBeenCalledExactlyOnceWith({
      where: {
        OR: [{ mentorId: MENTOR_ID }, { studentId: MENTOR_ID }],
        status: { title: { in: ['CONFIRMED', 'CONFIRMADA'] } },
        endAt: { lte: NOW },
      },
      orderBy: [{ endAt: 'desc' }, { startAt: 'desc' }, { id: 'asc' }],
      select: APPOINTMENT_SELECT,
    });
  });

  it('requests only the projection needed by the response, with no sensitive user data', () => {
    expect(APPOINTMENT_SELECT).toEqual({
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
    });
  });

  it('returns an appointment by id for the service to authorize', async () => {
    const record = createAppointmentRecord();
    findUnique.mockResolvedValue(record);

    await expect(repository.findById(APPOINTMENT_ID)).resolves.toBe(record);
    expect(findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { id: APPOINTMENT_ID },
      select: APPOINTMENT_SELECT,
    });
  });

  it('returns null for an unknown id', async () => {
    findUnique.mockResolvedValue(null);

    await expect(repository.findById(APPOINTMENT_ID)).resolves.toBeNull();
  });

  it.each(['upcoming', 'past'] as const)(
    'propagates database errors in scope=%s',
    async (scope) => {
      const failure = new Error('Database unavailable');
      findMany.mockRejectedValue(failure);

      await expect(repository.findMine(MENTOR_ID, scope, NOW)).rejects.toBe(
        failure,
      );
    },
  );

  it('propagates database errors while reading detail', async () => {
    const failure = new Error('Database unavailable');
    findUnique.mockRejectedValue(failure);

    await expect(repository.findById(APPOINTMENT_ID)).rejects.toBe(failure);
  });
});
