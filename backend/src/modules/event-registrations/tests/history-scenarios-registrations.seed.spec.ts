import { describe, expect, it, vi } from 'vitest';
import type { Prisma } from '../../../prisma/client.js';
import { HISTORY_EVENT_IDS } from '../../events/constants/history-scenarios.constants.js';
import { seedHistoryScenarioRegistrations } from '../seeds/history-scenarios-registrations.seed.js';

describe('history scenario registrations', () => {
  it('seeds twelve active historical registrations, two private accounts, and attendance only for one workshop', async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 18 });
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const attendanceCreateMany = vi.fn().mockResolvedValue({ count: 1 });
    const findUniqueOrThrow = vi
      .fn()
      .mockResolvedValueOnce({ id: 'confirmed' })
      .mockResolvedValueOnce({ id: 'cancelled' });
    const tx = {
      registrationStatus: { findUniqueOrThrow },
      eventRegistration: { createMany, updateMany },
      eventAttendance: { createMany: attendanceCreateMany },
    };
    await seedHistoryScenarioRegistrations(
      tx as unknown as Prisma.TransactionClient,
      'primary',
      'secondary',
      new Date('2026-11-20T15:00:00.000Z'),
    );
    const registrations = createMany.mock.calls[0][0]
      .data as Prisma.EventRegistrationCreateManyInput[];
    const primary = registrations.filter((item) => item.userId === 'primary');
    const secondary = registrations.filter((item) => item.userId === 'secondary');
    expect(registrations).toHaveLength(18);
    expect(primary.filter((item) => HISTORY_EVENT_IDS.historical.slice(0, 12).includes(item.eventId))).toHaveLength(12);
    expect(secondary).toHaveLength(2);
    expect(secondary.map((item) => item.eventId)).toEqual([
      HISTORY_EVENT_IDS.historical[0],
      HISTORY_EVENT_IDS.historical[12],
    ]);
    expect(primary.find((item) => item.eventId === HISTORY_EVENT_IDS.historical[0])?.id).not.toBe(secondary[0].id);
    expect(primary.find((item) => item.eventId === HISTORY_EVENT_IDS.cancelledRegistration)).toMatchObject({ statusId: 'cancelled', cancelledAt: expect.any(Date) });
    expect(primary.find((item) => item.eventId === HISTORY_EVENT_IDS.boundary)).toMatchObject({ statusId: 'confirmed', cancelledAt: null });
    expect(primary.find((item) => item.eventId === HISTORY_EVENT_IDS.future)).toMatchObject({
      id: 'a1b2c3d4-e5f6-4a78-9b0c-d1e2f3a4b5c6',
      statusId: 'confirmed',
      cancelledAt: null,
    });
    expect(primary.find((item) => item.eventId === HISTORY_EVENT_IDS.fixedBoundary)).toMatchObject({
      statusId: 'confirmed',
      cancelledAt: null,
      registeredAt: new Date('2026-11-20T12:00:00.000Z'),
    });
    expect(new Set(registrations.map((item) => item.id)).size).toBe(18);
    expect(createMany).toHaveBeenCalledWith({ data: registrations, skipDuplicates: true });
    expect(updateMany).toHaveBeenCalledWith({
      where: { eventId: HISTORY_EVENT_IDS.future, userId: 'primary' },
      data: { id: 'a1b2c3d4-e5f6-4a78-9b0c-d1e2f3a4b5c6' },
    });
    expect(attendanceCreateMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ registrationId: primary[4].id, checkedInAt: expect.any(Date) })],
      skipDuplicates: true,
    });
    expect(attendanceCreateMany.mock.calls[0][0].data[0].registrationId).not.toBe(primary[5].id);
  });
});
