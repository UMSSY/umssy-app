import { describe, expect, it, vi } from 'vitest';
import { toBoliviaTime } from '../../../common/utils/date-time.js';
import type { Prisma } from '../../../prisma/client.js';
import {
  SEED_APPOINTMENT_IDS, SEED_BLOCK_IDS, SEED_BLOCKED_DATE_ID, SEED_SERIES_ID,
} from '../constants/seed-availability.constants.js';
import { buildBlockPlan, getWeeks, seedAvailability } from '../seeds/availability.seed.js';

const MIDWEEK = new Date('2026-10-21T15:00:00Z');
const EARLY_MONDAY = new Date('2026-10-19T04:00:00Z');
const SUNDAY_NIGHT = new Date('2026-10-26T02:30:00Z');
const users = { mentorId: 'mentor-a', performanceMentorId: 'mentor-b', graduateId: 'titulado-1' };

describe('plan de escenarios B-08', () => {
  it.each([EARLY_MONDAY, MIDWEEK, SUNDAY_NIGHT, new Date('2026-10-26T04:00:00Z')])(
    'respeta calendario, relaciones y horarios para %s', (now) => {
      const weeks = getWeeks(now);
      const plan = buildBlockPlan(weeks, now);
      expect(weeks.previous.end).toEqual(weeks.current.start);
      expect(weeks.current.end).toEqual(weeks.next.start);
      expect(toBoliviaTime(weeks.current.start)).toMatchObject({ weekday: 1, hours: 0, minutes: 0 });
      expect(plan.blocks).toHaveLength(58);
      expect(plan.blocks.filter((block) => block.appointmentId)).toHaveLength(53);
      const performance = plan.blocks.filter((block) => block.mentorKey === 'performance');
      expect(performance).toHaveLength(50);
      expect(performance.every((block) => block.appointmentId && block.start > now && block.start >= weeks.next.start && block.end < weeks.next.end)).toBe(true);
      expect(plan.past.end < now).toBe(true);
      expect(plan.current.start >= weeks.current.start && plan.current.end < weeks.current.end).toBe(true);
      expect(plan.next.start >= weeks.next.start && plan.next.end < weeks.next.end).toBe(true);
      expect(plan.free.start > now).toBe(true);
      expect(plan.free.appointmentId).toBeUndefined();
      expect(plan.blocked.appointmentId).toBeUndefined();
      expect(plan.blockedOn.toISOString().slice(0, 10)).toBe(toBoliviaTime(plan.blocked.start).date);
      expect(plan.blocks.filter((block) => block.mentorKey === 'primary' && block.appointmentId)
        .some((block) => toBoliviaTime(block.start).date === toBoliviaTime(plan.blocked.start).date)).toBe(false);
      for (const block of plan.blocks) {
        expect(block.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
        expect(block.end.getTime() - block.start.getTime()).toBe(30 * 60_000);
        expect(toBoliviaTime(block.start).hours).toBeGreaterThanOrEqual(7);
        expect(toBoliviaTime(block.end).hours).toBeLessThanOrEqual(22);
        expect(toBoliviaTime(block.start).minutes % 30).toBe(0);
        for (const other of plan.blocks) {
          if (block.id === other.id) continue;
          // Ambos mentores comparten titulado: tampoco puede haber citas simultáneas.
          if (block.mentorKey === other.mentorKey || (block.appointmentId && other.appointmentId)) {
            expect(block.start < other.end && block.end > other.start).toBe(false);
          }
        }
      }
      const series = plan.blocks.filter((block) => block.seriesId);
      expect(series).toHaveLength(3);
      expect(new Set(series.map((block) => block.seriesId))).toEqual(new Set([SEED_SERIES_ID]));
      expect(new Set(series.map((block) => toBoliviaTime(block.start).time))).toEqual(new Set(['16:00']));
      expect(new Set(series.map((block) => toBoliviaTime(block.start).weekday))).toEqual(new Set([3]));
      expect(series[1].start.getTime() - series[0].start.getTime()).toBe(7 * 86_400_000);
      expect(series[0].repeatUntil?.toISOString().slice(0, 10)).toBe(toBoliviaTime(series[2].start).date);
    },
  );

  it('elige una cita futura hasta el último horario válido y avisa después del cierre', () => {
    const lastSlot = new Date('2026-10-26T01:29:59Z');
    expect(buildBlockPlan(getWeeks(lastSlot), lastSlot).current.start.toISOString()).toBe('2026-10-26T01:30:00.000Z');
    const plan = buildBlockPlan(getWeeks(SUNDAY_NIGHT), SUNDAY_NIGHT);
    expect(plan.current.end < SUNDAY_NIGHT).toBe(true);
    expect(plan.warnings).toHaveLength(1);
    expect(buildBlockPlan(getWeeks(EARLY_MONDAY), EARLY_MONDAY).warnings).toEqual([]);
  });

  it('mantiene las identidades al repetir y al cambiar de semana', () => {
    const first = buildBlockPlan(getWeeks(MIDWEEK), MIDWEEK);
    expect(buildBlockPlan(getWeeks(MIDWEEK), MIDWEEK)).toEqual(first);
    const nextWeek = new Date('2026-10-28T15:00:00Z');
    const later = buildBlockPlan(getWeeks(nextWeek), nextWeek);
    expect(later.blocks.map((block) => [block.id, block.appointmentId])).toEqual(first.blocks.map((block) => [block.id, block.appointmentId]));
    expect(later.past.start.getTime() - first.past.start.getTime()).toBe(7 * 86_400_000);
  });
});

function buildTx() {
  const tx = {
    availabilityBlock: {
      findMany: vi.fn().mockResolvedValue([]), deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      createMany: vi.fn().mockResolvedValue({ count: 58 }),
    },
    appointment: {
      findMany: vi.fn().mockResolvedValue([]), deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      createMany: vi.fn().mockResolvedValue({ count: 53 }),
    },
    blockedDate: {
      findUnique: vi.fn().mockResolvedValue(null), findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }), create: vi.fn().mockResolvedValue({}),
    },
    orientationType: { findFirst: vi.fn().mockResolvedValue({ id: 'orientation-1' }) },
    mentorOrientationType: { upsert: vi.fn().mockResolvedValue({}) },
    appointmentStatus: { upsert: vi.fn().mockImplementation(async ({ where }) => ({ id: where.title })) },
  };
  return { tx, client: tx as unknown as Prisma.TransactionClient };
}

describe('persistencia del seed', () => {
  it('crea los tres estados, 53 citas válidas, asociaciones, bloqueo y serie sin borrar por usuario', async () => {
    const { tx, client } = buildTx();
    const result = await seedAvailability(client, users, MIDWEEK);
    expect(result).toMatchObject({ statuses: 3, blocks: 58, appointments: 53, blockedDates: 1, series: 1 });
    expect(tx.appointmentStatus.upsert.mock.calls.map(([arg]) => arg.where.title)).toEqual(['CONFIRMED', 'CANCELLED', 'COMPLETED']);
    expect(tx.appointment.deleteMany).toHaveBeenCalledWith({ where: { id: { in: SEED_APPOINTMENT_IDS } } });
    expect(tx.availabilityBlock.deleteMany).toHaveBeenCalledWith({ where: { id: { in: SEED_BLOCK_IDS } } });
    expect(tx.blockedDate.deleteMany).toHaveBeenCalledWith({ where: { id: SEED_BLOCKED_DATE_ID } });
    expect(tx.appointment.deleteMany).toHaveBeenCalledBefore(tx.availabilityBlock.deleteMany);
    expect(tx.availabilityBlock.deleteMany).toHaveBeenCalledBefore(tx.availabilityBlock.createMany);
    expect(tx.mentorOrientationType.upsert).toHaveBeenCalledTimes(2);
    expect(tx.blockedDate.create).toHaveBeenCalledWith({ data: expect.objectContaining({ mentorId: users.mentorId, reason: expect.any(String), blockedOn: result.plan.blockedOn }) });
    const appointments = tx.appointment.createMany.mock.calls[0][0].data;
    const blocks = tx.availabilityBlock.createMany.mock.calls[0][0].data;
    expect(appointments.filter((appointment) => appointment.mentorId === users.performanceMentorId)).toHaveLength(50);
    for (const appointment of appointments) {
      expect(appointment).toMatchObject({ statusId: 'CONFIRMED', orientationTypeId: 'orientation-1', studentId: users.graduateId });
      expect(blocks.find((block) => block.id === appointment.blockId)).toMatchObject({ mentorId: appointment.mentorId, startAt: appointment.startAt, endAt: appointment.endAt });
    }
  });

  it('rechaza referencias ajenas sobre bloques reservados antes de escribir', async () => {
    const { tx, client } = buildTx();
    tx.availabilityBlock.findMany.mockResolvedValueOnce([{ id: SEED_BLOCK_IDS[0], mentorId: users.mentorId, appointments: [{ id: 'foreign-appointment' }], proposals: [] }]);
    await expect(seedAvailability(client, users, MIDWEEK)).rejects.toThrow('referencias ajenas');
    expect(tx.appointment.deleteMany).not.toHaveBeenCalled();
    expect(tx.appointmentStatus.upsert).not.toHaveBeenCalled();
  });

  it('conserva historiales y propuestas de las citas', async () => {
    const { tx, client } = buildTx();
    tx.appointment.findMany.mockResolvedValueOnce([{ id: SEED_APPOINTMENT_IDS[0], mentorId: users.mentorId, studentId: users.graduateId, blockId: SEED_BLOCK_IDS[0], history: [{ id: 'history-1' }], proposals: [] }]);
    await expect(seedAvailability(client, users, MIDWEEK)).rejects.toThrow('referencias ajenas');
    expect(tx.appointment.deleteMany).not.toHaveBeenCalled();
  });

  it('falla sin borrar ante un solapamiento con bloques ajenos', async () => {
    const { tx, client } = buildTx();
    const plan = buildBlockPlan(getWeeks(MIDWEEK), MIDWEEK);
    tx.availabilityBlock.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'foreign-block', mentorId: users.mentorId, startAt: plan.next.start, endAt: plan.next.end }]);
    await expect(seedAvailability(client, users, MIDWEEK)).rejects.toThrow('colisiona con datos ajenos');
    expect(tx.availabilityBlock.deleteMany).not.toHaveBeenCalled();
  });

  it('rechaza una fecha bloqueada ajena en un horario de B-08', async () => {
    const { tx, client } = buildTx();
    const plan = buildBlockPlan(getWeeks(MIDWEEK), MIDWEEK);
    tx.blockedDate.findMany.mockResolvedValue([{ mentorId: users.mentorId, blockedOn: plan.blockedOn }]);
    await expect(seedAvailability(client, users, MIDWEEK)).rejects.toThrow('colisiona');
    expect(tx.blockedDate.deleteMany).not.toHaveBeenCalled();
  });

  it('exige un tema activo y participantes distintos', async () => {
    const { tx, client } = buildTx();
    tx.orientationType.findFirst.mockResolvedValue(null);
    await expect(seedAvailability(client, users, MIDWEEK)).rejects.toThrow('tema activo');
    await expect(seedAvailability(client, { ...users, performanceMentorId: users.mentorId }, MIDWEEK)).rejects.toThrow('distintos');
    expect(tx.appointment.deleteMany).not.toHaveBeenCalled();
  });

  it('no bloquea una fecha alcanzada por una cita ajena que empieza el día anterior', async () => {
    const { tx, client } = buildTx();
    const plan = buildBlockPlan(getWeeks(MIDWEEK), MIDWEEK);
    const midnight = plan.blockedOn.getTime() + 4 * 3_600_000;
    tx.appointment.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{
      mentorId: users.mentorId, studentId: 'other-graduate',
      startAt: new Date(midnight - 30 * 60_000), endAt: new Date(midnight + 60 * 60_000),
    }]);
    await expect(seedAvailability(client, users, MIDWEEK)).rejects.toThrow('fecha a bloquear contiene citas activas');
    expect(tx.appointment.deleteMany).not.toHaveBeenCalled();
    expect(tx.blockedDate.create).not.toHaveBeenCalled();
  });
});
