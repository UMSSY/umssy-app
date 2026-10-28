import { Test, type TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AvailabilityService } from '../../availability/services/availability.service.js';
import { BlockedDatesService } from '../../availability/services/blocked-dates.service.js';
import { MentorsService } from '../../mentors/services/mentors.service.js';
import { AppointmentNotFoundException } from '../exceptions/appointment-not-found.exception.js';
import { AppointmentNotOwnedException } from '../exceptions/appointment-not-owned.exception.js';
import { AppointmentMapper } from '../mappers/appointment.mapper.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';
import { AppointmentsService } from '../services/appointments.service.js';
import {
  APPOINTMENT_ID,
  createAppointmentRecord,
  MENTOR_ID,
  NOW,
  OTHER_USER_ID,
  STUDENT_ID,
} from './fixtures/appointment-record.fixture.js';

describe('AppointmentsService', () => {
  const repository = { findMine: vi.fn(), findById: vi.fn() };
  const mapper = { toResponse: vi.fn(), toResponseList: vi.fn() };
  let moduleRef: TestingModule;
  let service: AppointmentsService;

  beforeEach(async () => {
    vi.resetAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    moduleRef = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: AppointmentsRepository, useValue: repository },
        { provide: AppointmentMapper, useValue: mapper },
        { provide: AvailabilityService, useValue: {} },
        { provide: BlockedDatesService, useValue: {} },
        { provide: MentorsService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(AppointmentsService);
  });

  afterEach(async () => {
    vi.useRealTimers();
    await moduleRef.close();
  });

  it.each(['upcoming', 'past'] as const)(
    'queries scope=%s with the session user and a single reference instant',
    async (scope) => {
      const records = [createAppointmentRecord()];
      const response = [{ id: APPOINTMENT_ID }];
      repository.findMine.mockImplementation(async () => {
        vi.setSystemTime(new Date('2026-10-22T15:01:00.000Z'));
        return records;
      });
      mapper.toResponseList.mockReturnValue(response);

      await expect(service.findMine(MENTOR_ID, { scope })).resolves.toBe(
        response,
      );
      expect(repository.findMine).toHaveBeenCalledExactlyOnceWith(
        MENTOR_ID,
        scope,
        NOW,
      );
      expect(mapper.toResponseList).toHaveBeenCalledExactlyOnceWith(
        records,
        MENTOR_ID,
      );
    },
  );

  it('returns an empty list for a genuinely empty query', async () => {
    repository.findMine.mockResolvedValue([]);
    mapper.toResponseList.mockReturnValue([]);

    await expect(
      service.findMine(STUDENT_ID, { scope: 'upcoming' }),
    ).resolves.toEqual([]);
    expect(mapper.toResponseList).toHaveBeenCalledWith([], STUDENT_ID);
  });

  it('does not turn a failed database query into an empty list', async () => {
    const failure = new Error('Database unavailable');
    repository.findMine.mockRejectedValue(failure);

    await expect(
      service.findMine(STUDENT_ID, { scope: 'upcoming' }),
    ).rejects.toBe(failure);
    expect(mapper.toResponseList).not.toHaveBeenCalled();
  });

  it.each([MENTOR_ID, STUDENT_ID])(
    'allows participant %s to read the same appointment',
    async (userId) => {
      const record = createAppointmentRecord();
      const response = { id: APPOINTMENT_ID };
      repository.findById.mockResolvedValue(record);
      mapper.toResponse.mockReturnValue(response);

      await expect(service.findOne(userId, APPOINTMENT_ID)).resolves.toBe(
        response,
      );
      expect(repository.findById).toHaveBeenCalledExactlyOnceWith(
        APPOINTMENT_ID,
      );
      expect(mapper.toResponse).toHaveBeenCalledExactlyOnceWith(record, userId);
    },
  );

  it('throws 404 for an appointment that does not exist before mapping', async () => {
    repository.findById.mockResolvedValue(null);
    const result = service.findOne(MENTOR_ID, APPOINTMENT_ID);

    await expect(result).rejects.toBeInstanceOf(AppointmentNotFoundException);
    await expect(result).rejects.toMatchObject({ statusCode: 404, data: null });
    expect(mapper.toResponse).not.toHaveBeenCalled();
  });

  it('throws 403 with no appointment data for another user before mapping', async () => {
    repository.findById.mockResolvedValue(createAppointmentRecord());
    const result = service.findOne(OTHER_USER_ID, APPOINTMENT_ID);

    await expect(result).rejects.toBeInstanceOf(AppointmentNotOwnedException);
    await expect(result).rejects.toMatchObject({ statusCode: 403, data: null });
    expect(mapper.toResponse).not.toHaveBeenCalled();
  });

  it('propagates a failed detail query', async () => {
    const failure = new Error('Database unavailable');
    repository.findById.mockRejectedValue(failure);

    await expect(service.findOne(MENTOR_ID, APPOINTMENT_ID)).rejects.toBe(
      failure,
    );
    expect(mapper.toResponse).not.toHaveBeenCalled();
  });
});
