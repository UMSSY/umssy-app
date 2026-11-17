import { type Mock, vi } from 'vitest';
import { REGISTRATION_STATUS_TITLES } from '../../../common/constants/registration-status.constants.js';
import { EVENT_PASS_LIFECYCLE_FIXTURES } from '../../events/seeds/event-pass-lifecycle-fixtures.seed.js';
import { seedEventRegistrations } from '../seeds/event-registrations.seed.js';

interface UpsertRegistrationCall {
  where: { id?: string };
  update: { cancelledAt?: Date | null };
  create: { statusId?: string; cancelledAt?: Date | null };
}

describe('Cancellation seed fixtures', () => {
  let tx: {
    registrationStatus: { upsert: Mock };
    eventRegistration: {
      findMany: Mock;
      updateMany: Mock;
      upsert: Mock;
    };
  };

  beforeEach(() => {
    tx = {
      registrationStatus: {
        upsert: vi
          .fn()
          .mockImplementation(
            async ({ where }: { where: { title: string } }) => ({
              id:
                where.title === REGISTRATION_STATUS_TITLES.cancelled
                  ? 'status-cancelled-id'
                  : 'status-confirmed-id',
              title: where.title,
            }),
          ),
      },
      eventRegistration: {
        findMany: vi.fn().mockResolvedValue([]),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        upsert: vi.fn().mockResolvedValue({}),
      },
    };
  });

  it('includes fixtures for cancellable, pre-cancelled, full-capacity and expired registration scenarios', () => {
    const qa096Fixtures = EVENT_PASS_LIFECYCLE_FIXTURES.filter((item) =>
      item.title.startsWith('[QA 09.6]'),
    );

    expect(qa096Fixtures).toHaveLength(4);
    expect(
      qa096Fixtures.some(
        (item) => item.dayOffset > 0 && item.initialStatus === 'confirmed',
      ),
    ).toBe(true);
    expect(
      qa096Fixtures.some((item) => item.initialStatus === 'cancelled'),
    ).toBe(true);
    expect(qa096Fixtures.some((item) => item.capacity === 1)).toBe(true);
    expect(qa096Fixtures.some((item) => item.dayOffset < 0)).toBe(true);
  });

  it('upserts active and cancelled registration fixtures idempotently', async () => {
    await seedEventRegistrations(tx as never, 'student-qa-1');

    const calls = tx.eventRegistration.upsert.mock
      .calls as [UpsertRegistrationCall][];

    const cancelledCall = calls.find(
      ([args]) => args.where.id === '8b1c2d3e-4f5a-4b6c-8d9e-0f1a2b3c4d02',
    );
    expect(cancelledCall).toBeDefined();
    expect(cancelledCall?.[0].create.statusId).toBe('status-cancelled-id');
    expect(cancelledCall?.[0].create.cancelledAt).toBeInstanceOf(Date);
    expect(cancelledCall?.[0].update.cancelledAt).toBeInstanceOf(Date);

    const fullWorkshopCall = calls.find(
      ([args]) => args.where.id === '8b1c2d3e-4f5a-4b6c-8d9e-0f1a2b3c4d03',
    );
    expect(fullWorkshopCall).toBeDefined();
    expect(fullWorkshopCall?.[0].create.statusId).toBe('status-confirmed-id');
    expect(fullWorkshopCall?.[0].create.cancelledAt).toBeNull();
  });
});