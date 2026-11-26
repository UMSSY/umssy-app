import { afterEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { CreateProposalSchema } from '../requests/create-proposal.request.js';
import { EventProposalsRepository } from '../repositories/event-proposals.repository.js';
import { EventProposalsService } from '../services/event-proposals.service.js';
import { EventsRepository } from '../repositories/events.repository.js';
import { EventsService } from '../services/events.service.js';
import { buildProposalSessions } from '../utils/build-proposal-sessions.js';
import {
  getScheduleEnd,
  getScheduleStart,
  hasOverlappingSessions,
  toBoliviaInstant,
} from '../utils/event-session-schedule.js';
import { assertRegistrationOpen } from '../../event-registrations/utils/assert-registration-open.js';

const valid = {
  title: 'Python',
  description: 'Taller práctico',
  categoryId: '11111111-1111-4111-8111-111111111111',
  eventDate: '2026-12-12',
  startTime: '09:00',
  endTime: '12:00',
  capacity: '31',
  modality: 'presencial',
  location: 'Facultad de Tecnología, Aula 1',
};

const session = (startsAt: string, endsAt: string) => ({
  startsAt: new Date(startsAt),
  endsAt: new Date(endsAt),
});

afterEach(() => vi.useRealTimers());

describe('event session schedule', () => {
  it('converts a Bolivia local date and time to the UTC instant', () => {
    expect(toBoliviaInstant('2026-12-12', '09:00').toISOString()).toBe(
      '2026-12-12T13:00:00.000Z',
    );
  });

  it('derives the schedule start and end from all sessions', () => {
    const sessions = [
      session('2026-12-19T13:00:00Z', '2026-12-19T16:00:00Z'),
      session('2026-12-12T13:00:00Z', '2026-12-12T16:00:00Z'),
    ];
    expect(getScheduleStart(sessions).toISOString()).toBe(
      '2026-12-12T13:00:00.000Z',
    );
    expect(getScheduleEnd(sessions).toISOString()).toBe(
      '2026-12-19T16:00:00.000Z',
    );
  });

  it('allows contiguous sessions and rejects a positive intersection', () => {
    const first = session('2026-12-12T13:00:00Z', '2026-12-12T15:00:00Z');
    expect(
      hasOverlappingSessions([
        first,
        session('2026-12-12T15:00:00Z', '2026-12-12T16:00:00Z'),
      ]),
    ).toBe(false);
    expect(
      hasOverlappingSessions([
        first,
        session('2026-12-12T14:59:00Z', '2026-12-12T16:00:00Z'),
      ]),
    ).toBe(true);
  });

  it('builds proposal sessions sorted by start, inheriting the main location', () => {
    const sessions = buildProposalSessions({
      ...valid,
      additionalSessions: [
        { eventDate: '2026-12-05', startTime: '10:00', endTime: '11:00' },
        {
          eventDate: '2026-12-19',
          startTime: '09:00',
          endTime: '12:00',
          location: 'Auditorio central',
        },
      ],
    });
    expect(
      sessions.map((s) => [s.eventDate, s.location, s.startsAt.toISOString()]),
    ).toEqual([
      ['2026-12-05', valid.location, '2026-12-05T14:00:00.000Z'],
      ['2026-12-12', valid.location, '2026-12-12T13:00:00.000Z'],
      ['2026-12-19', 'Auditorio central', '2026-12-19T13:00:00.000Z'],
    ]);
  });
});

describe('proposal request with additional sessions', () => {
  const extra = (sessions: unknown) => ({
    ...valid,
    additionalSessions: JSON.stringify(sessions),
  });

  it('keeps accepting a single-day proposal without sessions', () => {
    expect(CreateProposalSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts additional sessions sent as JSON text', () => {
    const parsed = CreateProposalSchema.safeParse(
      extra([
        { eventDate: '2026-12-19', startTime: '09:00', endTime: '12:00' },
      ]),
    );
    expect(parsed.success).toBe(true);
    expect(parsed.data?.additionalSessions).toHaveLength(1);
  });

  it.each([
    ['invalid JSON', '{'],
    [
      'a session ending before it starts',
      JSON.stringify([
        { eventDate: '2026-12-19', startTime: '12:00', endTime: '09:00' },
      ]),
    ],
    [
      'an unknown field',
      JSON.stringify([
        {
          eventDate: '2026-12-19',
          startTime: '09:00',
          endTime: '12:00',
          capacity: 10,
        },
      ]),
    ],
    [
      'more than 20 sessions in total',
      JSON.stringify(
        Array.from({ length: 20 }, (_, index) => ({
          eventDate: `2027-01-${String(index + 1).padStart(2, '0')}`,
          startTime: '09:00',
          endTime: '10:00',
        })),
      ),
    ],
  ])('rejects %s', (_, additionalSessions) => {
    expect(
      CreateProposalSchema.safeParse({ ...valid, additionalSessions }).success,
    ).toBe(false);
  });

  it('rejects sessions that overlap the main session', () => {
    const parsed = CreateProposalSchema.safeParse(
      extra([
        { eventDate: '2026-12-12', startTime: '11:00', endTime: '13:00' },
      ]),
    );
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]).toMatchObject({
      path: ['additionalSessions'],
      message: 'Las sesiones no pueden superponerse.',
    });
  });

  it('validates the location of an additional session', () => {
    const parsed = CreateProposalSchema.safeParse(
      extra([
        {
          eventDate: '2026-12-19',
          startTime: '09:00',
          endTime: '12:00',
          location: ', Aula',
        },
      ]),
    );
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0].path).toEqual([
      'additionalSessions',
      0,
      'location',
    ]);
  });
});

describe('proposal persistence with sessions', () => {
  function setup() {
    const create = vi.fn().mockImplementation(({ data }) => ({
      id: randomUUID(),
      proposalHash: '',
      ...data,
    }));
    const tx = {
      user: {
        findFirst: vi
          .fn()
          .mockResolvedValue({ firstName: 'Ana', lastName: 'López' }),
      },
      eventCategory: {
        findUnique: vi.fn().mockResolvedValue({ id: valid.categoryId }),
      },
      eventStatus: { upsert: vi.fn().mockResolvedValue({ id: 'status' }) },
      eventOrigin: { upsert: vi.fn().mockResolvedValue({ id: 'origin' }) },
      eventModality: { upsert: vi.fn().mockResolvedValue({ id: 'modality' }) },
      event: { create },
    };
    const prisma = {
      event: { findUnique: vi.fn().mockResolvedValue(null) },
      $transaction: vi.fn((fn) => fn(tx)),
    };
    const files = {
      validate: vi.fn().mockReturnValue({
        buffer: Buffer.from('image'),
        detectedMimeType: 'image/png',
      }),
    };
    const service = new EventProposalsService(
      new EventProposalsRepository(prisma as never),
      files as never,
    );
    return { create, service };
  }

  it('creates one session for a single-day proposal', async () => {
    const { create, service } = setup();
    await service.create('user', valid, undefined, randomUUID());
    expect(create.mock.calls[0][0].data.sessions).toEqual({
      create: [
        {
          startsAt: new Date('2026-12-12T13:00:00.000Z'),
          endsAt: new Date('2026-12-12T16:00:00.000Z'),
          location: valid.location,
        },
      ],
    });
  });

  it('stores every session and keeps the legacy fields on the earliest one', async () => {
    const { create, service } = setup();
    await service.create(
      'user',
      {
        ...valid,
        additionalSessions: JSON.stringify([
          { eventDate: '2026-12-05', startTime: '14:00', endTime: '16:00' },
        ]),
      },
      undefined,
      randomUUID(),
    );
    const { data } = create.mock.calls[0][0];
    expect(data.sessions.create).toHaveLength(2);
    expect(data.eventDate).toEqual(new Date('2026-12-05T00:00:00Z'));
    expect(data.startTime).toEqual(new Date('1970-01-01T14:00:00Z'));
    expect(data.endTime).toEqual(new Date('1970-01-01T16:00:00Z'));
  });
});

describe('workshop timing with sessions', () => {
  const legacy = {
    eventDate: new Date('2026-12-12T00:00:00Z'),
    startTime: new Date('1970-01-01T09:00:00Z'),
    endTime: new Date('1970-01-01T12:00:00Z'),
  };
  const sessions = [
    session('2026-12-12T13:00:00Z', '2026-12-12T16:00:00Z'),
    session('2026-12-19T13:00:00Z', '2026-12-19T16:00:00Z'),
  ];
  const service = new EventsService({} as never);

  it('stays active between sessions and finishes at the end of the last one', () => {
    const event = { ...legacy, sessions };
    expect(service.isFinished(event, new Date('2026-12-15T12:00:00Z'))).toBe(
      false,
    );
    expect(service.isFinished(event, new Date('2026-12-19T15:59:59Z'))).toBe(
      false,
    );
    expect(service.isFinished(event, new Date('2026-12-19T16:00:00Z'))).toBe(
      true,
    );
  });

  it('keeps the legacy rule for a workshop without sessions', () => {
    expect(
      service.isFinished(
        { ...legacy, sessions: [] },
        new Date('2026-12-12T16:00:00Z'),
      ),
    ).toBe(true);
  });

  it('closes registration at the start of the first session', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const event = { ...legacy, sessions: [...sessions].reverse() };
    vi.setSystemTime(new Date('2026-12-12T12:59:59Z'));
    expect(() => assertRegistrationOpen(event, false)).not.toThrow();
    vi.setSystemTime(new Date('2026-12-12T13:00:00Z'));
    expect(() => assertRegistrationOpen(event, false)).toThrow();
  });

  it('compares schedule conflicts session by session', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const repository = new EventsRepository({} as never);
    await repository.findScheduleConflict(
      { event: { findFirst } } as never,
      { id: 'event-a', ...legacy, sessions },
      ['event-b'],
    );
    const { where } = findFirst.mock.calls[0][0];
    expect(where.id).toEqual({ in: ['event-b'], not: 'event-a' });
    expect(where.OR[0].sessions.some.OR).toEqual([
      {
        startsAt: { lt: sessions[0].endsAt },
        endsAt: { gt: sessions[0].startsAt },
      },
      {
        startsAt: { lt: sessions[1].endsAt },
        endsAt: { gt: sessions[1].startsAt },
      },
    ]);
    expect(where.OR[1]).toEqual({
      sessions: { none: {} },
      OR: [
        {
          eventDate: new Date('2026-12-12T00:00:00Z'),
          startTime: { lt: new Date('1970-01-01T12:00:00Z') },
          endTime: { gt: new Date('1970-01-01T09:00:00Z') },
        },
        {
          eventDate: new Date('2026-12-19T00:00:00Z'),
          startTime: { lt: new Date('1970-01-01T12:00:00Z') },
          endTime: { gt: new Date('1970-01-01T09:00:00Z') },
        },
      ],
    });
  });

  it('checks a newly registered legacy workshop against every session of an existing workshop', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const repository = new EventsRepository({} as never);
    await repository.findScheduleConflict(
      { event: { findFirst } } as never,
      {
        id: 'legacy-event',
        eventDate: new Date('2026-12-19T00:00:00Z'),
        startTime: new Date('1970-01-01T10:00:00Z'),
        endTime: new Date('1970-01-01T11:00:00Z'),
        sessions: [],
      },
      ['multi-event'],
    );
    const { where } = findFirst.mock.calls[0][0];
    expect(where.OR[0].sessions.some.OR).toEqual([
      {
        startsAt: { lt: new Date('2026-12-19T15:00:00Z') },
        endsAt: { gt: new Date('2026-12-19T14:00:00Z') },
      },
    ]);
    expect(where.OR[1].sessions).toEqual({ none: {} });
  });
});
