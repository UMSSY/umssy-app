import { describe, expect, it, vi } from 'vitest';
import {
  ATTENDANCE_QA_CASES,
  ATTENDANCE_QA_EVENT_ID,
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
      upsert: vi.fn(({ where, update, create }) => {
        attendances.set(
          where.registrationId,
          attendances.has(where.registrationId) ? update : create,
        );
        return Promise.resolve({});
      }),
    },
  };
  return { tx, registrations, attendances, eventUpsert, ownerId };
}

describe('HU-08-12 attendance QA fixtures', () => {
  it('creates a published workshop for today in Bolivia and all four scannable outcomes', async () => {
    const { tx, registrations, attendances, eventUpsert, ownerId } = setup();
    const now = new Date('2026-11-17T02:30:00.000Z'); // 16 Nov, 22:30 in Bolivia.
    const result = await seedAttendanceQaFixtures(tx as never, now);
    expect(result.eventId).toBe(ATTENDANCE_QA_EVENT_ID);
    expect(eventUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ATTENDANCE_QA_EVENT_ID },
        create: expect.objectContaining({
          eventDate: new Date('2026-11-16T00:00:00.000Z'),
          startTime: new Date('1970-01-01T00:00:00.000Z'),
          endTime: new Date('1970-01-01T23:59:59.999Z'),
          statusId: 'published-id',
          createdById: ownerId,
        }),
      }),
    );
    expect(registrations.size).toBe(3);
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
    const references = Object.values(result.references);
    expect(new Set(references).size).toBe(4);
    for (const reference of references)
      expect(reference).toMatch(/^v1:[a-f0-9]{64}$/);
    expect(result.references.invalid).toBe(ATTENDANCE_QA_INVALID_REFERENCE);
    expect(references.slice(0, 3)).not.toContain(
      ATTENDANCE_QA_INVALID_REFERENCE,
    );
  });

  it('preserves QR tokens and restores fixture states when run again', async () => {
    const { tx, registrations, attendances } = setup();
    const first = await seedAttendanceQaFixtures(
      tx as never,
      new Date('2026-11-16T14:00:00.000Z'),
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
      new Date('2026-11-16T15:00:00.000Z'),
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
