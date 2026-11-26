import { describe, expect, it, vi } from 'vitest';
import {
  MULTISESSION_SCENARIOS,
  MULTISESSION_SUPPORT_THRESHOLD,
  multisessionId,
} from '../constants/multisession-scenarios.constants.js';
import type {
  MultisessionScenarioDefinition,
  MultisessionScenarioKey,
} from '../constants/multisession-scenarios.constants.js';
import { seedMultisessionScenarios } from '../seeds/multisession-scenarios.seed.js';

const at = (value: string) => new Date(`${value}:00.000-04:00`).getTime();
const byKey = (key: MultisessionScenarioKey) =>
  MULTISESSION_SCENARIOS.find((scenario) => scenario.key === key)!;
const ranges = (scenario: MultisessionScenarioDefinition) =>
  scenario.sessions.map((session) => ({
    start: at(`${session.date}T${session.start}`),
    end: at(`${session.date}T${session.end}`),
  }));
const overlaps = (
  a: { start: number; end: number },
  b: { start: number; end: number },
) => a.start < b.end && b.start < a.end;
const supportCount = (scenario: MultisessionScenarioDefinition) =>
  scenario.registrations.filter((registration) => !registration.cancelled)
    .length;

describe('multisession scenario data', () => {
  it('uses valid, unique ids for events, sessions and registrations', () => {
    const ids = MULTISESSION_SCENARIOS.flatMap((scenario) => [
      multisessionId('event', scenario.number),
      ...scenario.sessions.map((_, index) =>
        multisessionId('session', scenario.number, index),
      ),
      ...scenario.registrations.map((_, index) =>
        multisessionId('registration', scenario.number, index),
      ),
    ]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids)
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
  });

  it('keeps realistic texts without test labels', () => {
    for (const scenario of MULTISESSION_SCENARIOS) {
      const text = [
        scenario.title,
        scenario.description,
        scenario.instructorName,
        scenario.location,
      ].join(' ');
      expect(text).not.toMatch(/\b(qa|test|prueba|seed)\b|\[/i);
      expect(scenario.description.length).toBeLessThanOrEqual(300);
    }
  });

  it('builds ordered sessions without overlaps', () => {
    for (const scenario of MULTISESSION_SCENARIOS) {
      const sessions = ranges(scenario);
      sessions.forEach((session, index) => {
        expect(session.end).toBeGreaterThan(session.start);
        if (index > 0)
          expect(session.start).toBeGreaterThanOrEqual(sessions[index - 1].end);
      });
    }
  });

  it('closes voting before the first session and keeps the support totals', () => {
    for (const scenario of MULTISESSION_SCENARIOS.filter(
      (item) => item.kind !== 'published',
    )) {
      const deadline = at(
        `${scenario.votingDeadline!.date}T${scenario.votingDeadline!.time}`,
      );
      const created = at(
        `${scenario.createdAt.date}T${scenario.createdAt.time}`,
      );
      expect(deadline - created).toBe(10 * 24 * 60 * 60 * 1000);
      expect(deadline).toBeLessThan(ranges(scenario)[0].start);
      expect(supportCount(scenario)).toBeLessThan(
        MULTISESSION_SUPPORT_THRESHOLD,
      );
    }
    expect(supportCount(byKey('kubernetes'))).toBe(0);
    expect(supportCount(byKey('postgresql'))).toBe(5);
    expect(supportCount(byKey('playwright'))).toBe(9);
    expect(supportCount(byKey('artificialIntelligence'))).toBe(9);
    expect(byKey('cybersecurity').kind).toBe('expired');
  });

  it('never gives the participant two workshops at the same time', () => {
    const participantSessions = MULTISESSION_SCENARIOS.filter((scenario) =>
      scenario.registrations.some(
        (registration) => registration.user === 'participant',
      ),
    ).flatMap(ranges);
    participantSessions.forEach((session, index) =>
      participantSessions
        .slice(index + 1)
        .forEach((other) => expect(overlaps(session, other)).toBe(false)),
    );
    // Para el escenario de cruces: NestJS solo choca con Scrum y Kanban, no con Pandas ni con sus pases.
    const nest = ranges(byKey('nestjs'));
    expect(
      nest.some((s) => ranges(byKey('agile')).some((o) => overlaps(s, o))),
    ).toBe(true);
    expect(
      nest.some((s) => ranges(byKey('pandas')).some((o) => overlaps(s, o))),
    ).toBe(false);
    expect(
      nest.some((s) => participantSessions.some((o) => overlaps(s, o))),
    ).toBe(false);
  });

  it('fits the QA day of 27/11', () => {
    const aws = ranges(byKey('aws'));
    expect(aws[0].start).toBeLessThanOrEqual(at('2026-11-27T10:00'));
    expect(aws[0].end).toBeGreaterThan(at('2026-11-27T10:00'));
    expect(aws[1].start).toBeLessThanOrEqual(at('2026-11-27T16:00'));
    expect(aws[1].end).toBeGreaterThan(at('2026-11-27T16:00'));
    const docker = ranges(byKey('docker'));
    for (const moment of ['2026-11-27T08:00', '2026-11-28T08:00']) {
      expect(docker[0].end).toBeLessThan(at(moment));
      expect(docker[1].start).toBeGreaterThan(at(moment));
    }
    const git = ranges(byKey('git'));
    expect(git[git.length - 1].end).toBeLessThan(at('2026-11-27T00:00'));
  });

  it('fits the sprint review of 28/11 from 07:30 to 08:00', () => {
    for (const session of ranges(byKey('react'))) {
      expect(session.start).toBeGreaterThanOrEqual(at('2026-11-28T07:30'));
      expect(session.end).toBeLessThanOrEqual(at('2026-11-28T08:00'));
    }
    const ux = byKey('userExperience').votingDeadline!;
    expect(at(`${ux.date}T${ux.time}`)).toBe(at('2026-11-28T07:40'));
    expect(ranges(byKey('wireless'))[0].end).toBeLessThan(
      at('2026-11-28T07:30'),
    );
  });
});

function setup() {
  const supporterIds = (email: string) => `user:${email}`;
  const tx = {
    eventStatus: {
      findUniqueOrThrow: vi.fn(({ where }) =>
        Promise.resolve({ id: `status:${where.title}` }),
      ),
    },
    eventOrigin: {
      findUniqueOrThrow: vi.fn(({ where }) =>
        Promise.resolve({ id: `origin:${where.title}` }),
      ),
    },
    eventModality: {
      findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'modality' }),
    },
    eventCategory: {
      findUniqueOrThrow: vi.fn(({ where }) =>
        Promise.resolve({ id: `category:${where.name}` }),
      ),
    },
    registrationStatus: {
      findUniqueOrThrow: vi.fn(({ where }) =>
        Promise.resolve({ id: `registration:${where.title}` }),
      ),
    },
    user: {
      findUniqueOrThrow: vi.fn(({ where }) =>
        Promise.resolve({ id: supporterIds(where.email) }),
      ),
    },
    event: { findUnique: vi.fn().mockResolvedValue(null), upsert: vi.fn() },
    eventSession: { deleteMany: vi.fn(), upsert: vi.fn() },
    eventRegistration: { deleteMany: vi.fn(), upsert: vi.fn() },
    eventAttendance: { deleteMany: vi.fn(), create: vi.fn() },
  };
  return tx;
}

describe('seedMultisessionScenarios', () => {
  const users = { organizerId: 'organizer', participantId: 'participant' };

  it('stores every workshop with its first session as the main schedule', async () => {
    const tx = setup();
    const summary = await seedMultisessionScenarios(tx as never, users);

    expect(summary.events).toBe(MULTISESSION_SCENARIOS.length);
    expect(tx.eventSession.deleteMany).not.toHaveBeenCalled();
    expect(tx.eventRegistration.deleteMany).not.toHaveBeenCalled();
    expect(tx.eventAttendance.deleteMany).not.toHaveBeenCalled();
    const aws = tx.event.upsert.mock.calls
      .map(([call]) => call)
      .find(
        (call) =>
          call.where.id === multisessionId('event', byKey('aws').number),
      )!;
    expect(aws.create).toMatchObject({
      createdById: 'organizer',
      statusId: 'status:Publicado',
      originId: 'origin:Institucional',
      eventDate: new Date('2026-11-27T00:00:00.000Z'),
      startTime: new Date('1970-01-01T08:00:00.000Z'),
      endTime: new Date('1970-01-01T13:00:00.000Z'),
      supportThreshold: null,
    });
    const playwright = tx.event.upsert.mock.calls
      .map(([call]) => call)
      .find(
        (call) =>
          call.where.id === multisessionId('event', byKey('playwright').number),
      )!;
    expect(playwright.update).toMatchObject({
      statusId: 'status:Votacion',
      originId: 'origin:Comunidad',
      supportThreshold: 10,
      votingDeadline: new Date('2026-12-04T16:00:00.000Z'),
    });
  });

  it('saves the sessions as Bolivia instants and removes stale ones', async () => {
    const tx = setup();
    await seedMultisessionScenarios(tx as never, users, { reset: true });
    const awsNumber = byKey('aws').number;
    expect(tx.eventSession.deleteMany).toHaveBeenCalledWith({
      where: {
        eventId: multisessionId('event', awsNumber),
        id: {
          notIn: [
            multisessionId('session', awsNumber, 0),
            multisessionId('session', awsNumber, 1),
          ],
        },
      },
    });
    expect(tx.eventSession.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: multisessionId('session', awsNumber, 1) },
        update: expect.objectContaining({
          startsAt: new Date('2026-11-27T18:00:00.000Z'),
          endsAt: new Date('2026-11-28T00:00:00.000Z'),
        }),
      }),
    );
  });

  it('resets registrations, cancellations and attendances on every run', async () => {
    const tx = setup();
    const summary = await seedMultisessionScenarios(tx as never, users, {
      reset: true,
    });
    const awsNumber = byKey('aws').number;

    expect(tx.eventRegistration.deleteMany).toHaveBeenCalledWith({
      where: {
        eventId: multisessionId('event', awsNumber),
        id: {
          notIn: byKey('aws').registrations.map((_, index) =>
            multisessionId('registration', awsNumber, index),
          ),
        },
      },
    });
    const registrations = tx.eventRegistration.upsert.mock.calls.map(
      ([call]) => call,
    );
    const cancelled = registrations.find(
      (call) => call.where.id === multisessionId('registration', awsNumber, 1),
    )!;
    expect(cancelled.update.statusId).toBe('registration:Cancelada');
    expect(cancelled.update.cancelledAt).toBeInstanceOf(Date);
    expect(cancelled.create.qrToken).toMatch(/^[0-9a-f]{64}$/);

    const dockerNumber = byKey('docker').number;
    expect(tx.eventAttendance.create).toHaveBeenCalledWith({
      data: {
        registrationId: multisessionId('registration', dockerNumber, 0),
        sessionId: multisessionId('session', dockerNumber, 0),
        checkedInAt: new Date('2026-11-26T13:06:00.000Z'),
        checkedInById: 'organizer',
        checkedInOffline: false,
        syncedAt: null,
      },
    });
    expect(summary.attendances).toBe(
      tx.eventAttendance.create.mock.calls.length,
    );
    expect(summary.registrations).toBe(registrations.length);
  });

  it('preserves existing scenarios and their registrations during the general seed', async () => {
    const tx = setup();
    tx.event.findUnique.mockResolvedValue({ id: 'existing' });
    const summary = await seedMultisessionScenarios(tx as never, users);

    expect(summary).toEqual({
      events: 0,
      sessions: 0,
      registrations: 0,
      attendances: 0,
    });
    expect(tx.event.upsert).not.toHaveBeenCalled();
    expect(tx.eventSession.deleteMany).not.toHaveBeenCalled();
    expect(tx.eventRegistration.deleteMany).not.toHaveBeenCalled();
    expect(tx.eventAttendance.deleteMany).not.toHaveBeenCalled();
  });
});
