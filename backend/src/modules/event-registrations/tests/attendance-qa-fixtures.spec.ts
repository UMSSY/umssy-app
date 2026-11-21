import { describe, expect, it, vi } from 'vitest';
import { assertAttendanceWindow } from '../utils/assert-attendance-window.js';
import {
  ATTENDANCE_QA_CASES,
  ATTENDANCE_QA_EVENT_IDS,
  ATTENDANCE_QA_INVALID_REFERENCE,
  seedAttendanceQaFixtures,
} from '../seeds/attendance-qa-fixtures.seed.js';

function setup() {
  const registrations = new Map<
    string,
    {
      id: string;
      eventId: string;
      userId: string;
      statusId: string;
      cancelledAt: Date | null;
      qrToken: string;
    }
  >();
  const attendances = new Map<
    string,
    { checkedInAt: Date; checkedInById: string }
  >();
  const ownerId = 'owner-id';
  const lookup = (id: string) => vi.fn().mockResolvedValue({ id });
  const eventUpsert = vi.fn();
  const tx = {
    user: {
      findUniqueOrThrow: vi.fn(({ where }) =>
        Promise.resolve({
          id: where.email === 'prueba@umss.edu.bo' ? ownerId : where.email,
        }),
      ),
    },
    eventCategory: { findUniqueOrThrow: lookup('category-id') },
    eventModality: { findUniqueOrThrow: lookup('modality-id') },
    eventOrigin: { findUniqueOrThrow: lookup('origin-id') },
    eventStatus: { findUniqueOrThrow: lookup('published-id') },
    registrationStatus: {
      findUniqueOrThrow: vi.fn(({ where }) =>
        Promise.resolve({ id: where.title }),
      ),
    },
    event: { upsert: eventUpsert },
    eventRegistration: {
      upsert: vi.fn(({ where, update, create, select }) => {
        expect(select).toEqual({ qrToken: true });
        const record = registrations.get(where.id) ?? create;
        const current = { ...record, ...update };
        registrations.set(where.id, current);
        return Promise.resolve({ qrToken: current.qrToken });
      }),
    },
    eventAttendance: {
      deleteMany: vi.fn(({ where }) => {
        for (const id of where.registrationId.in) attendances.delete(id);
        return Promise.resolve({ count: 0 });
      }),
      create: vi.fn(({ data }) => {
        attendances.set(data.registrationId, data);
        return Promise.resolve({});
      }),
    },
  };
  return { tx, registrations, attendances, eventUpsert, ownerId };
}

describe('HU-08-12 attendance QA fixtures', () => {
  it('creates Saturday, Sunday and Monday workshops with four attendance outcomes', async () => {
    const { tx, registrations, attendances, eventUpsert, ownerId } = setup();
    const now = new Date('2026-11-21T21:00:00.000Z'); // Saturday, 17:00 in Bolivia.
    const result = await seedAttendanceQaFixtures(tx as never, now);
    const eventsById = new Map(
      eventUpsert.mock.calls.map(([call]) => [call.create.id, call.create]),
    );
    const sundayPrimary = eventsById.get(ATTENDANCE_QA_EVENT_IDS.sundayPrimary);
    const sundaySecond = eventsById.get(ATTENDANCE_QA_EVENT_IDS.sundaySecond);
    const monday = eventsById.get(ATTENDANCE_QA_EVENT_IDS.monday);
    const saturday = eventsById.get(ATTENDANCE_QA_EVENT_IDS.saturdayClosed);

    expect(result.eventId).toBe(ATTENDANCE_QA_EVENT_IDS.sundayPrimary);
    expect(result.events).toEqual(ATTENDANCE_QA_EVENT_IDS);
    expect(result.schedule.attendanceOpensHoursBefore).toBe(2);
    expect(sundayPrimary).toMatchObject({
      title: 'Taller de visualización de datos con Power BI',
      eventDate: new Date('2026-11-22T00:00:00.000Z'),
      startTime: new Date('1970-01-01T20:00:00.000Z'),
      endTime: new Date('1970-01-01T23:00:00.000Z'),
      statusId: 'published-id',
      createdById: ownerId,
    });
    expect(sundaySecond).toMatchObject({
      title: 'Taller de gestión ágil de proyectos con Scrum',
      eventDate: new Date('2026-11-22T00:00:00.000Z'),
      startTime: new Date('1970-01-01T21:00:00.000Z'),
    });
    expect(monday).toMatchObject({
      title: 'Taller de desarrollo de aplicaciones web con React',
      eventDate: new Date('2026-11-23T00:00:00.000Z'),
      startTime: new Date('1970-01-01T10:00:00.000Z'),
      endTime: new Date('1970-01-01T12:00:00.000Z'),
    });
    expect(saturday).toMatchObject({
      title: 'Taller de comunicación efectiva para equipos de trabajo',
      eventDate: new Date('2026-11-21T00:00:00.000Z'),
      startTime: new Date('1970-01-01T10:00:00.000Z'),
      endTime: new Date('1970-01-01T12:00:00.000Z'),
    });
    expect(() =>
      assertAttendanceWindow(
        sundayPrimary!,
        new Date('2026-11-22T22:00:00.000Z'), // 18:00 in Bolivia, two hours early.
      ),
    ).not.toThrow();
    expect(() =>
      assertAttendanceWindow(
        sundayPrimary!,
        new Date('2026-11-22T21:59:59.999Z'),
      ),
    ).toThrowError(expect.objectContaining({ statusCode: 409 }));
    expect(() =>
      assertAttendanceWindow(
        sundaySecond!,
        new Date('2026-11-22T23:00:00.000Z'), // 19:00 in Bolivia, two hours early.
      ),
    ).not.toThrow();
    expect(() =>
      assertAttendanceWindow(
        sundaySecond!,
        new Date('2026-11-22T22:59:59.999Z'),
      ),
    ).toThrowError(expect.objectContaining({ statusCode: 409 }));
    expect(() =>
      assertAttendanceWindow(monday!, new Date('2026-11-23T12:00:00.000Z')),
    ).not.toThrow();
    expect(() =>
      assertAttendanceWindow(monday!, new Date('2026-11-23T11:59:59.999Z')),
    ).toThrowError(expect.objectContaining({ statusCode: 409 }));
    expect(() =>
      assertAttendanceWindow(saturday!, new Date('2026-11-21T16:00:00.000Z')),
    ).toThrowError(expect.objectContaining({ statusCode: 409 }));
    expect(registrations.size).toBe(6);
    expect(
      registrations.get(ATTENDANCE_QA_CASES.valid.registrationId),
    ).toMatchObject({ statusId: 'Confirmada', cancelledAt: null });
    expect(
      registrations.get(ATTENDANCE_QA_CASES.cancelled.registrationId),
    ).toMatchObject({ statusId: 'Cancelada', cancelledAt: now });
    expect(
      registrations.get(ATTENDANCE_QA_CASES.duplicate.registrationId),
    ).toMatchObject({ statusId: 'Confirmada', cancelledAt: null });
    expect(attendances.size).toBe(1);
    expect(
      attendances.get(ATTENDANCE_QA_CASES.duplicate.registrationId),
    ).toMatchObject({ checkedInById: ownerId, checkedInAt: now });
    expect(Object.values(result.references)).toHaveLength(7);
    expect(result.references.invalid).toBe(ATTENDANCE_QA_INVALID_REFERENCE);
    for (const [name, reference] of Object.entries(result.references)) {
      if (name === 'invalid') continue;
      expect(reference).toMatch(/^v1:[a-f0-9]{64}$/);
    }
  });

  it('preserves QR tokens and resets the fixture states when run again', async () => {
    const { tx, registrations, attendances } = setup();
    const first = await seedAttendanceQaFixtures(
      tx as never,
      new Date('2026-11-21T21:00:00.000Z'),
    );
    attendances.set(ATTENDANCE_QA_CASES.valid.registrationId, {
      checkedInAt: new Date(),
      checkedInById: 'owner-id',
    });
    attendances.set(ATTENDANCE_QA_CASES.cancelled.registrationId, {
      checkedInAt: new Date(),
      checkedInById: 'owner-id',
    });
    registrations.get(ATTENDANCE_QA_CASES.cancelled.registrationId)!.statusId =
      'Confirmada';
    const second = await seedAttendanceQaFixtures(
      tx as never,
      new Date('2026-11-21T22:00:00.000Z'),
    );
    expect(second.references).toEqual(first.references);
    expect(attendances.has(ATTENDANCE_QA_CASES.valid.registrationId)).toBe(
      false,
    );
    expect(attendances.has(ATTENDANCE_QA_CASES.cancelled.registrationId)).toBe(
      false,
    );
    expect(attendances.has(ATTENDANCE_QA_CASES.duplicate.registrationId)).toBe(
      true,
    );
    expect(
      registrations.get(ATTENDANCE_QA_CASES.cancelled.registrationId)?.statusId,
    ).toBe('Cancelada');
  });
});
