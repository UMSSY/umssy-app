import { Test, type TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AvailabilityService } from '../../availability/services/availability.service.js';
import { BlockedDatesService } from '../../availability/services/blocked-dates.service.js';
import { MentorsService } from '../../mentors/services/mentors.service.js';
import { PhotoNotFoundException } from '../../profile/exceptions/photo-not-found.exception.js';
import { ProfilePhotoService } from '../../profile/services/profile-photo.service.js';
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

const MEETING_URL =
  'https://meet.jit.si/umssy-99999999-9999-4999-8999-999999999999';

describe('AppointmentsService', () => {
  const repository = {
    findMine: vi.fn(),
    countMine: vi.fn(),
    findById: vi.fn(),
    assignMeetingUrl: vi.fn(),
  };
  const mapper = {
    toResponse: vi.fn(),
    toDetailResponse: vi.fn(),
    toResponseList: vi.fn(),
  };
  const profilePhotoService = { getPhoto: vi.fn() };
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
        { provide: ProfilePhotoService, useValue: profilePhotoService },
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
      repository.countMine.mockResolvedValue(1);
      repository.findMine.mockImplementation(async () => {
        vi.setSystemTime(new Date('2026-10-22T15:01:00.000Z'));
        return records;
      });
      mapper.toResponseList.mockReturnValue(response);

      await expect(
        service.findMine(MENTOR_ID, { scope, page: 1, pageSize: 10 }),
      ).resolves.toEqual({
        items: response,
        total: 1,
        page: 1,
        pageSize: 10,
      });
      expect(repository.countMine).toHaveBeenCalledExactlyOnceWith(
        MENTOR_ID,
        scope,
        NOW,
      );
      expect(repository.findMine).toHaveBeenCalledExactlyOnceWith(
        MENTOR_ID,
        scope,
        NOW,
        1,
        10,
      );
      expect(mapper.toResponseList).toHaveBeenCalledExactlyOnceWith(
        records,
        MENTOR_ID,
      );
    },
  );

  it('returns an empty page for a genuinely empty query', async () => {
    repository.countMine.mockResolvedValue(0);
    repository.findMine.mockResolvedValue([]);
    mapper.toResponseList.mockReturnValue([]);

    await expect(
      service.findMine(STUDENT_ID, { scope: 'upcoming', page: 1, pageSize: 10 }),
    ).resolves.toEqual({ items: [], total: 0, page: 1, pageSize: 10 });
    expect(mapper.toResponseList).toHaveBeenCalledWith([], STUDENT_ID);
  });

  it('keeps the first page when there are no appointments at all', async () => {
    repository.countMine.mockResolvedValue(0);
    repository.findMine.mockResolvedValue([]);
    mapper.toResponseList.mockReturnValue([]);

    await service.findMine(STUDENT_ID, {
      scope: 'upcoming',
      page: 7,
      pageSize: 10,
    });

    expect(repository.findMine).toHaveBeenCalledExactlyOnceWith(
      STUDENT_ID,
      'upcoming',
      NOW,
      1,
      10,
    );
  });

  it('does not advance past the last page when more pages are requested', async () => {
    repository.countMine.mockResolvedValue(48);
    repository.findMine.mockResolvedValue([]);
    mapper.toResponseList.mockReturnValue([]);

    const page = await service.findMine(STUDENT_ID, {
      scope: 'upcoming',
      page: 99,
      pageSize: 10,
    });

    expect(page).toEqual({ items: [], total: 48, page: 5, pageSize: 10 });
    expect(repository.findMine).toHaveBeenCalledExactlyOnceWith(
      STUDENT_ID,
      'upcoming',
      NOW,
      5,
      10,
    );
  });

  it('serves the requested page when it exists', async () => {
    repository.countMine.mockResolvedValue(11);
    repository.findMine.mockResolvedValue([]);
    mapper.toResponseList.mockReturnValue([]);

    const page = await service.findMine(STUDENT_ID, {
      scope: 'past',
      page: 2,
      pageSize: 10,
    });

    expect(page).toEqual({ items: [], total: 11, page: 2, pageSize: 10 });
    expect(repository.findMine).toHaveBeenCalledExactlyOnceWith(
      STUDENT_ID,
      'past',
      NOW,
      2,
      10,
    );
  });

  it('does not turn a failed database query into an empty page', async () => {
    const failure = new Error('Database unavailable');
    repository.countMine.mockResolvedValue(1);
    repository.findMine.mockRejectedValue(failure);

    await expect(
      service.findMine(STUDENT_ID, { scope: 'upcoming', page: 1, pageSize: 10 }),
    ).rejects.toBe(failure);
    expect(mapper.toResponseList).not.toHaveBeenCalled();
  });

  it.each([MENTOR_ID, STUDENT_ID])(
    'allows participant %s to read the same appointment',
    async (userId) => {
      const record = createAppointmentRecord({ meetingUrl: MEETING_URL });
      const response = { id: APPOINTMENT_ID };
      repository.findById.mockResolvedValue(record);
      mapper.toDetailResponse.mockReturnValue(response);

      await expect(service.findOne(userId, APPOINTMENT_ID)).resolves.toBe(
        response,
      );
      expect(repository.findById).toHaveBeenCalledExactlyOnceWith(
        APPOINTMENT_ID,
      );
      expect(mapper.toDetailResponse).toHaveBeenCalledExactlyOnceWith(
        record,
        userId,
        MEETING_URL,
      );
      expect(repository.assignMeetingUrl).not.toHaveBeenCalled();
    },
  );

  it('throws 404 for an appointment that does not exist before mapping', async () => {
    repository.findById.mockResolvedValue(null);
    const result = service.findOne(MENTOR_ID, APPOINTMENT_ID);

    await expect(result).rejects.toBeInstanceOf(AppointmentNotFoundException);
    await expect(result).rejects.toMatchObject({ statusCode: 404, data: null });
    expect(mapper.toDetailResponse).not.toHaveBeenCalled();
    expect(repository.assignMeetingUrl).not.toHaveBeenCalled();
  });

  it('throws 403 with no appointment data for another user before mapping', async () => {
    repository.findById.mockResolvedValue(createAppointmentRecord());
    const result = service.findOne(OTHER_USER_ID, APPOINTMENT_ID);

    await expect(result).rejects.toBeInstanceOf(AppointmentNotOwnedException);
    await expect(result).rejects.toMatchObject({ statusCode: 403, data: null });
    expect(mapper.toDetailResponse).not.toHaveBeenCalled();
    expect(repository.assignMeetingUrl).not.toHaveBeenCalled();
  });

  it('propagates a failed detail query', async () => {
    const failure = new Error('Database unavailable');
    repository.findById.mockRejectedValue(failure);

    await expect(service.findOne(MENTOR_ID, APPOINTMENT_ID)).rejects.toBe(
      failure,
    );
    expect(mapper.toDetailResponse).not.toHaveBeenCalled();
    expect(repository.assignMeetingUrl).not.toHaveBeenCalled();
  });

  it('assigns a meeting url the first time a confirmed appointment without one is read', async () => {
    const record = createAppointmentRecord();
    repository.findById.mockResolvedValue(record);
    repository.assignMeetingUrl.mockResolvedValue(MEETING_URL);

    await service.findOne(STUDENT_ID, APPOINTMENT_ID);

    expect(repository.assignMeetingUrl).toHaveBeenCalledExactlyOnceWith(
      APPOINTMENT_ID,
      expect.stringMatching(/^https:\/\/meet\.jit\.si\/umssy-[0-9a-f-]{36}$/),
    );
    expect(mapper.toDetailResponse).toHaveBeenCalledExactlyOnceWith(
      record,
      STUDENT_ID,
      MEETING_URL,
    );
  });

  it.each([
    [
      'cancelled',
      createAppointmentRecord({
        status: { title: 'CANCELLED' },
        meetingUrl: 'https://meet.jit.si/umssy-old',
      }),
    ],
    [
      'completed',
      createAppointmentRecord({
        status: { title: 'COMPLETED' },
        meetingUrl: 'https://meet.jit.si/umssy-old',
      }),
    ],
    [
      'ended',
      createAppointmentRecord({
        endAt: NOW,
        meetingUrl: 'https://meet.jit.si/umssy-old',
      }),
    ],
  ])(
    'hides the meeting url of a %s appointment without assigning one',
    async (_case, record) => {
      repository.findById.mockResolvedValue(record);

      await service.findOne(MENTOR_ID, APPOINTMENT_ID);

      expect(mapper.toDetailResponse).toHaveBeenCalledExactlyOnceWith(
        record,
        MENTOR_ID,
        null,
      );
      expect(repository.assignMeetingUrl).not.toHaveBeenCalled();
    },
  );

  it.each([
    [MENTOR_ID, STUDENT_ID],
    [STUDENT_ID, MENTOR_ID],
  ])(
    'returns to participant %s the photo of the counterpart %s',
    async (userId, counterpartId) => {
      const photo = { content: Buffer.from('png'), mimeType: 'image/png' };
      repository.findById.mockResolvedValue(createAppointmentRecord());
      profilePhotoService.getPhoto.mockResolvedValue(photo);

      await expect(
        service.getCounterpartPhoto(userId, APPOINTMENT_ID),
      ).resolves.toBe(photo);
      expect(profilePhotoService.getPhoto).toHaveBeenCalledExactlyOnceWith(
        counterpartId,
      );
    },
  );

  it('throws 403 before reading any photo for a user outside the appointment', async () => {
    repository.findById.mockResolvedValue(createAppointmentRecord());
    const result = service.getCounterpartPhoto(OTHER_USER_ID, APPOINTMENT_ID);

    await expect(result).rejects.toBeInstanceOf(AppointmentNotOwnedException);
    expect(profilePhotoService.getPhoto).not.toHaveBeenCalled();
  });

  it('throws 404 before reading any photo for an appointment that does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.getCounterpartPhoto(MENTOR_ID, APPOINTMENT_ID),
    ).rejects.toBeInstanceOf(AppointmentNotFoundException);
    expect(profilePhotoService.getPhoto).not.toHaveBeenCalled();
  });

  it('propagates 404 when the counterpart has no photo', async () => {
    repository.findById.mockResolvedValue(createAppointmentRecord());
    profilePhotoService.getPhoto.mockRejectedValue(
      new PhotoNotFoundException(),
    );

    await expect(
      service.getCounterpartPhoto(STUDENT_ID, APPOINTMENT_ID),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
