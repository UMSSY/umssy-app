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
import { APPOINTMENT_DOCUMENT_METADATA_SELECT } from '../constants/appointment-document-select.constants.js';

describe('AppointmentsRepository', () => {
  const findMany = vi.fn();
  const findUnique = vi.fn();
  const updateMany = vi.fn();
  const count = vi.fn();
  let repository: AppointmentsRepository;

  beforeEach(() => {
    vi.resetAllMocks();
    repository = new AppointmentsRepository({
      appointment: { findMany, findUnique, updateMany, count },
    } as unknown as PrismaService);
  });

  it('filters upcoming confirmed appointments by either participant and the strict end boundary', async () => {
    const records = [createAppointmentRecord()];
    findMany.mockResolvedValue(records);

    await expect(
      repository.findMine(MENTOR_ID, 'upcoming', NOW, 1, 10),
    ).resolves.toBe(records);
    expect(findMany).toHaveBeenCalledExactlyOnceWith({
      where: {
        OR: [{ mentorId: MENTOR_ID }, { studentId: MENTOR_ID }],
        status: { title: { in: ['CONFIRMED', 'CONFIRMADA'] } },
        endAt: { gt: NOW },
      },
      orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
      skip: 0,
      take: 10,
      select: APPOINTMENT_SELECT,
    });
  });

  it('asks the database for the requested page instead of slicing in memory', async () => {
    findMany.mockResolvedValue([]);

    await repository.findMine(MENTOR_ID, 'upcoming', NOW, 4, 10);

    expect(findMany).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ skip: 30, take: 10 }),
    );
  });

  it('counts the same appointments the page query filters', async () => {
    count.mockResolvedValue(48);

    await expect(repository.countMine(MENTOR_ID, 'past', NOW)).resolves.toBe(
      48,
    );
    expect(count).toHaveBeenCalledExactlyOnceWith({
      where: {
        OR: [{ mentorId: MENTOR_ID }, { studentId: MENTOR_ID }],
        status: { title: { in: ['CONFIRMED', 'CONFIRMADA', 'COMPLETED', 'COMPLETADA'] } },
        endAt: { lte: NOW },
      },
    });
  });

  it('includes the exact end boundary in past and orders by latest finish with stable tie breaks', async () => {
    findMany.mockResolvedValue([]);

    await expect(
      repository.findMine(MENTOR_ID, 'past', NOW, 1, 10),
    ).resolves.toEqual([]);
    expect(findMany).toHaveBeenCalledExactlyOnceWith({
      where: {
        OR: [{ mentorId: MENTOR_ID }, { studentId: MENTOR_ID }],
        status: { title: { in: ['CONFIRMED', 'CONFIRMADA', 'COMPLETED', 'COMPLETADA'] } },
        endAt: { lte: NOW },
      },
      orderBy: [{ endAt: 'desc' }, { startAt: 'desc' }, { id: 'asc' }],
      skip: 0,
      take: 10,
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
      message: true,
      requestedAt: true,
      meetingUrl: true,
      mentor: { select: { id: true, firstName: true, lastName: true } },
      student: { select: { id: true, firstName: true, lastName: true } },
      orientationType: { select: { id: true, name: true } },
      status: { select: { title: true } },
      document: { select: APPOINTMENT_DOCUMENT_METADATA_SELECT },
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

      await expect(repository.findMine(MENTOR_ID, scope, NOW, 1, 10),
      ).rejects.toBe(
        failure,
      );
    },
  );

  it('propagates database errors while reading detail', async () => {
    const failure = new Error('Database unavailable');
    findUnique.mockRejectedValue(failure);

    await expect(repository.findById(APPOINTMENT_ID)).rejects.toBe(failure);
  });

  it('assigns the meeting url only when the appointment has none and returns the stored one', async () => {
    const meetingUrl = 'https://meet.jit.si/umssy-new';
    updateMany.mockResolvedValue({ count: 1 });
    findUnique.mockResolvedValue({ meetingUrl });

    await expect(
      repository.assignMeetingUrl(APPOINTMENT_ID, meetingUrl),
    ).resolves.toBe(meetingUrl);
    expect(updateMany).toHaveBeenCalledExactlyOnceWith({
      where: { id: APPOINTMENT_ID, meetingUrl: null },
      data: { meetingUrl },
    });
    expect(findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { id: APPOINTMENT_ID },
      select: { meetingUrl: true },
    });
  });

  it('keeps the meeting url that another request saved first', async () => {
    updateMany.mockResolvedValue({ count: 0 });
    findUnique.mockResolvedValue({
      meetingUrl: 'https://meet.jit.si/umssy-first',
    });

    await expect(
      repository.assignMeetingUrl(
        APPOINTMENT_ID,
        'https://meet.jit.si/umssy-late',
      ),
    ).resolves.toBe('https://meet.jit.si/umssy-first');
  });

  it('returns null when the appointment disappears while assigning the meeting url', async () => {
    updateMany.mockResolvedValue({ count: 0 });
    findUnique.mockResolvedValue(null);

    await expect(
      repository.assignMeetingUrl(
        APPOINTMENT_ID,
        'https://meet.jit.si/umssy-x',
      ),
    ).resolves.toBeNull();
  });
});
