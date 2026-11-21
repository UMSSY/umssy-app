import { describe, expect, it, vi } from 'vitest';
import type { Prisma } from '../../../prisma/client.js';
import { HISTORY_EVENT_IDS } from '../../events/constants/history-scenarios.constants.js';
import { seedHistoryScenarioRegistrations } from '../seeds/history-scenarios-registrations.seed.js';

describe('history scenario registrations', () => {
  it('seeds twelve active historical registrations, two private accounts, and attendance only for one workshop', async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 17 });
    const attendanceCreateMany = vi.fn().mockResolvedValue({ count: 1 });
    const findUniqueOrThrow = vi
      .fn()
      .mockResolvedValueOnce({ id: 'confirmed' })
      .mockResolvedValueOnce({ id: 'cancelled' });
    const tx = {
      registrationStatus: { findUniqueOrThrow },
      eventRegistration: { createMany },
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
    expect(registrations).toHaveLength(17);
    expect(primary.filter((item) => HISTORY_EVENT_IDS.historical.slice(0, 12).includes(item.eventId))).toHaveLength(12);
    expect(secondary).toHaveLength(2);
    expect(secondary.map((item) => item.eventId)).toEqual([
      HISTORY_EVENT_IDS.historical[0],
      HISTORY_EVENT_IDS.historical[12],
    ]);
    expect(primary.find((item) => item.eventId === HISTORY_EVENT_IDS.historical[0])?.id).not.toBe(secondary[0].id);
    expect(primary.find((item) => item.eventId === HISTORY_EVENT_IDS.cancelledRegistration)).toMatchObject({ statusId: 'cancelled', cancelledAt: expect.any(Date) });
    expect(primary.find((item) => item.eventId === HISTORY_EVENT_IDS.boundary)).toMatchObject({ statusId: 'confirmed', cancelledAt: null });
    expect(primary.find((item) => item.eventId === HISTORY_EVENT_IDS.future)).toMatchObject({ statusId: 'confirmed', cancelledAt: null });
    expect(new Set(registrations.map((item) => item.id)).size).toBe(17);
    expect(createMany).toHaveBeenCalledWith({ data: registrations, skipDuplicates: true });
    expect(attendanceCreateMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ registrationId: primary[4].id, checkedInAt: expect.any(Date) })],
      skipDuplicates: true,
    });
    expect(attendanceCreateMany.mock.calls[0][0].data[0].registrationId).not.toBe(primary[5].id);
  });
});
