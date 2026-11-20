import { describe, expect, it, vi } from 'vitest';
import { seedEventRegistrations } from '../seeds/event-registrations.seed.js';
import { SEED_EVENTS } from '../../events/constants/seed-events.constants.js';
import { EVENT_PASS_LIFECYCLE_FIXTURES } from '../../events/seeds/event-pass-lifecycle-fixtures.seed.js';

describe('registration catalog seed', () => {
  it('idempotently ensures both titles without changing existing registrations', async () => {
    const upsert = vi.fn().mockResolvedValue({ id: 'status' });
    const registrations = vi.fn();
    const tx = {
      registrationStatus: { upsert },
      eventRegistration: {
        upsert: registrations,
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    await seedEventRegistrations(tx as never, 'user');
    for (const title of ['Confirmada', 'Cancelada']) {
      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { title },
          update: {},
          create: expect.objectContaining({ title }),
        }),
      );
    }
    const calls = registrations.mock.calls.map(([args]) => args);
    for (const args of calls.filter(({ where }) =>
      'eventId_userId' in where,
    )) {
      expect(args.update).toEqual({});
    }
    for (const fixture of EVENT_PASS_LIFECYCLE_FIXTURES) {
      const call = calls.find(({ where }) => where.id === fixture.registrationId);
      expect(call?.create).toMatchObject({
        id: fixture.registrationId,
        eventId: fixture.eventId,
        userId: 'user',
        statusId: 'status',
      });
      expect(call?.create.qrToken).toMatch(/^[a-f0-9]{64}$/);
      expect(call?.update).toEqual({
        eventId: fixture.eventId,
        userId: 'user',
        statusId: 'status',
        cancelledAt: null,
      });
    }
  });
});

it('creates distinct valid QR tokens for the initial workshop registrations', async () => {
  const upsert = vi.fn().mockResolvedValue({ id: 'status' });
  const registrations = vi.fn();
  await seedEventRegistrations(
    {
      registrationStatus: { upsert },
      eventRegistration: {
        upsert: registrations,
        findMany: vi.fn().mockResolvedValue([]),
      },
    } as never,
    'user',
  );
  const tokens = registrations.mock.calls
    .map(([args]) => args)
    .filter(({ where }) =>
      'eventId_userId' in where &&
      SEED_EVENTS.some(({ id }) => id === where.eventId_userId.eventId),
    )
    .map(({ create }) => create.qrToken);
  expect(tokens).toHaveLength(2);
  for (const token of tokens) expect(token).toMatch(/^[a-f0-9]{64}$/);
  expect(new Set(tokens).size).toBe(tokens.length);
});

it('keeps stable lifecycle registration IDs and never replaces QR tokens on reruns', async () => {
  const upsert = vi.fn().mockResolvedValue({ id: 'status' });
  const registrations = vi.fn();
  const tx = {
    registrationStatus: { upsert },
    eventRegistration: {
      upsert: registrations,
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
  await seedEventRegistrations(tx as never, 'user');
  await seedEventRegistrations(tx as never, 'user');

  for (const fixture of EVENT_PASS_LIFECYCLE_FIXTURES) {
    const calls = registrations.mock.calls
      .map(([args]) => args)
      .filter(({ where }) => where.id === fixture.registrationId);
    expect(calls).toHaveLength(2);
    expect(calls[0].create.id).toBe(fixture.registrationId);
    expect(calls[1].create.id).toBe(fixture.registrationId);
    expect(calls[1].update).not.toHaveProperty('qrToken');
  }
});
