import { type Mock, vi } from 'vitest';
import { BOLIVIA_OFFSET_MS } from '../../../common/constants/date-time.constants.js';
import { REGISTRATION_STATUS_TITLES } from '../../../common/constants/registration-status.constants.js';
import { PUBLISHED_STATUS_TITLE } from '../../events/index.js';
import { EventFinishedException } from '../exceptions/event-finished.exception.js';
import { RegistrationAlreadyCancelledException } from '../exceptions/registration-already-cancelled.exception.js';
import { RegistrationClosedException } from '../exceptions/registration-closed.exception.js';
import { RegistrationNotFoundException } from '../exceptions/registration-not-found.exception.js';
import { RegistrationNotOwnedException } from '../exceptions/registration-not-owned.exception.js';
import { EventRegistrationsService } from '../services/event-registrations.service.js';
import { assertRegistrationOpen } from '../utils/assert-registration-open.js';

describe('EventRegistrationsService cancellation', () => {
  const futureEvent = {
    id: 'event-1',
    capacity: 1,
    eventDate: new Date('2026-11-20T00:00:00.000Z'),
    startTime: new Date('1970-01-01T10:00:00.000Z'),
    endTime: new Date('1970-01-01T12:00:00.000Z'),
    status: { title: PUBLISHED_STATUS_TITLE },
  };

  const confirmedRecord = {
    id: 'reg-1',
    eventId: 'event-1',
    userId: 'user-owner',
    cancelledAt: null,
    qrToken: 'qr-token-1',
    registeredAt: new Date('2026-11-10T10:00:00.000Z'),
    status: { title: REGISTRATION_STATUS_TITLES.confirmed },
  };

  let repository: {
    transaction: Mock;
    findById: Mock;
    findOwn: Mock;
    findConfirmedEventIds: Mock;
    countConfirmed: Mock;
    createConfirmed: Mock;
    cancel: Mock;
  };
  let eventsService: {
    lockEventRow: Mock;
    findForRegistration: Mock;
    isFinished: Mock;
    hasScheduleConflict: Mock;
  };
  let service: EventRegistrationsService;

  beforeEach(() => {
    repository = {
      transaction: vi.fn((op: (tx: unknown) => Promise<unknown>) => op({})),
      findById: vi.fn(),
      findOwn: vi.fn(),
      findConfirmedEventIds: vi.fn().mockResolvedValue([]),
      countConfirmed: vi.fn().mockResolvedValue(0),
      createConfirmed: vi.fn(),
      cancel: vi.fn(),
    };
    eventsService = {
      lockEventRow: vi.fn().mockResolvedValue(undefined),
      findForRegistration: vi.fn().mockResolvedValue(futureEvent),
      isFinished: vi.fn().mockReturnValue(false),
      hasScheduleConflict: vi.fn().mockResolvedValue(false),
    };
    service = new EventRegistrationsService(
      repository as never,
      eventsService as never,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('performs logical cancellation, locks event row and preserves registration id', async () => {
    const startsAt =
      Date.UTC(2026, 10, 20, 10, 0, 0, 0) - BOLIVIA_OFFSET_MS;
    vi.spyOn(Date, 'now').mockReturnValue(startsAt - 1000);

    repository.findById.mockResolvedValue(confirmedRecord);
    repository.cancel.mockImplementation(
      async (_tx: unknown, id: string, cancelledAt: Date) => ({
        ...confirmedRecord,
        id,
        cancelledAt,
        status: { title: REGISTRATION_STATUS_TITLES.cancelled },
      }),
    );

    const result = await service.cancel('reg-1', 'user-owner');

    expect(eventsService.lockEventRow).toHaveBeenCalledWith({}, 'event-1');
    expect(repository.cancel).toHaveBeenCalledWith(
      {},
      'reg-1',
      expect.any(Date),
    );
    expect(result.id).toBe('reg-1');
    expect(result.status).toBe('cancelled');
  });

  it('rejects cancellation when registration does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.cancel('missing-id', 'user-owner')).rejects.toThrow(
      RegistrationNotFoundException,
    );
    expect(repository.cancel).not.toHaveBeenCalled();
  });

  it('rejects cancellation requested by a different user', async () => {
    repository.findById.mockResolvedValue(confirmedRecord);

    await expect(service.cancel('reg-1', 'other-user')).rejects.toThrow(
      RegistrationNotOwnedException,
    );
    expect(repository.cancel).not.toHaveBeenCalled();
  });

  it('rejects duplicate cancellation when already cancelled', async () => {
    repository.findById.mockResolvedValue({
      ...confirmedRecord,
      cancelledAt: new Date('2026-11-11T10:00:00.000Z'),
      status: { title: REGISTRATION_STATUS_TITLES.cancelled },
    });

    await expect(service.cancel('reg-1', 'user-owner')).rejects.toThrow(
      RegistrationAlreadyCancelledException,
    );
    expect(repository.cancel).not.toHaveBeenCalled();
  });

  it('rejects cancellation at the exact start timestamp in Bolivia time', async () => {
    const startsAt =
      Date.UTC(2026, 10, 20, 10, 0, 0, 0) - BOLIVIA_OFFSET_MS;
    vi.spyOn(Date, 'now').mockReturnValue(startsAt);
    repository.findById.mockResolvedValue(confirmedRecord);

    await expect(service.cancel('reg-1', 'user-owner')).rejects.toThrow(
      RegistrationClosedException,
    );
    expect(repository.cancel).not.toHaveBeenCalled();
  });

  it('rejects cancellation when event is already finished', async () => {
    repository.findById.mockResolvedValue(confirmedRecord);
    eventsService.isFinished.mockReturnValue(true);

    await expect(service.cancel('reg-1', 'user-owner')).rejects.toThrow(
      EventFinishedException,
    );
    expect(repository.cancel).not.toHaveBeenCalled();
  });

  it('frees a spot so another user can register in a full workshop after cancellation', async () => {
    const startsAt =
      Date.UTC(2026, 10, 20, 10, 0, 0, 0) - BOLIVIA_OFFSET_MS;
    vi.spyOn(Date, 'now').mockReturnValue(startsAt - 60_000);

    repository.findById.mockResolvedValue(confirmedRecord);
    repository.cancel.mockResolvedValue({
      ...confirmedRecord,
      cancelledAt: new Date(),
      status: { title: REGISTRATION_STATUS_TITLES.cancelled },
    });

    await service.cancel('reg-1', 'user-owner');

    repository.findOwn.mockResolvedValue(null);
    repository.countConfirmed.mockResolvedValue(0);
    repository.createConfirmed.mockResolvedValue({
      ...confirmedRecord,
      id: 'reg-2',
      userId: 'user-second',
    });

    const created = await service.create('event-1', 'user-second');
    expect(created.id).toBe('reg-2');
    expect(created.status).toBe('confirmed');
  });
});

describe('assertRegistrationOpen', () => {
  const sampleEvent = {
    eventDate: new Date('2026-11-20T00:00:00.000Z'),
    startTime: new Date('1970-01-01T10:00:00.000Z'),
    endTime: new Date('1970-01-01T12:00:00.000Z'),
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows cancellation one second before Bolivia start time', () => {
    const startsAt =
      Date.UTC(2026, 10, 20, 10, 0, 0, 0) - BOLIVIA_OFFSET_MS;
    vi.spyOn(Date, 'now').mockReturnValue(startsAt - 1000);

    expect(() => assertRegistrationOpen(sampleEvent, false)).not.toThrow();
  });

  it('throws RegistrationClosedException at exact start time', () => {
    const startsAt =
      Date.UTC(2026, 10, 20, 10, 0, 0, 0) - BOLIVIA_OFFSET_MS;
    vi.spyOn(Date, 'now').mockReturnValue(startsAt);

    expect(() => assertRegistrationOpen(sampleEvent, false)).toThrow(
      RegistrationClosedException,
    );
  });
});