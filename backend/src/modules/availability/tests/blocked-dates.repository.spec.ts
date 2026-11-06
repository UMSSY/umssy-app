import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ACTIVE_APPOINTMENT_STATUSES } from '../constants/appointment-status.constants.js';
import { BlockedDatesRepository } from '../repositories/blocked-dates.repository.js';

const DAY = new Date('2026-10-27T00:00:00.000Z');

describe('BlockedDatesRepository', () => {
  const tx = {
    $executeRaw: vi.fn(),
    blockedDate: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    availabilityBlock: { findFirst: vi.fn() },
  };
  const prisma = {
    $transaction: vi.fn((work: (client: typeof tx) => Promise<unknown>) => work(tx)),
    blockedDate: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    availabilityBlock: { findFirst: vi.fn() },
  };
  let repository: BlockedDatesRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new BlockedDatesRepository(prisma as never);
  });

  describe('withDayLock', () => {
    it('toma el lock del mentor y el día antes de ejecutar el trabajo en la misma transacción', async () => {
      const order: string[] = [];
      tx.$executeRaw.mockImplementation(async () => order.push('lock'));

      const result = await repository.withDayLock('mentor-1', '2026-10-27', async (client) => {
        order.push('work');
        expect(client).toBe(tx);
        return 'hecho';
      });

      expect(result).toBe('hecho');
      expect(order).toEqual(['lock', 'work']);
      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
        maxWait: 5_000,
        timeout: 10_000,
      });
      expect(tx.$executeRaw.mock.calls[0][1]).toBe('mentor-day:mentor-1:2026-10-27');
    });

    it('propaga el error del trabajo para que la transacción se revierta', async () => {
      const failure = new Error('falló');
      await expect(
        repository.withDayLock('mentor-1', '2026-10-27', () => Promise.reject(failure)),
      ).rejects.toBe(failure);
    });
  });

  it('busca la fecha por mentor y día con la clave única', async () => {
    await repository.findByDay('mentor-1', DAY);
    expect(prisma.blockedDate.findUnique).toHaveBeenCalledWith({
      where: { mentorId_blockedOn: { mentorId: 'mentor-1', blockedOn: DAY } },
    });
  });

  it('usa el cliente de la transacción cuando se lo pasan', async () => {
    await repository.findByDay('mentor-1', DAY, tx as never);
    expect(tx.blockedDate.findUnique).toHaveBeenCalled();
    expect(prisma.blockedDate.findUnique).not.toHaveBeenCalled();
  });

  it('consulta todas las fechas desde hoy sin perder el filtro de propietario ni el orden', async () => {
    await repository.findInRange('mentor-1', DAY);
    expect(prisma.blockedDate.findMany).toHaveBeenCalledWith({
      where: { mentorId: 'mentor-1', blockedOn: { gte: DAY } },
      orderBy: { blockedOn: 'asc' },
    });
  });

  it('busca por id', async () => {
    await repository.findById('blocked-1');
    expect(prisma.blockedDate.findUnique).toHaveBeenCalledWith({ where: { id: 'blocked-1' } });
  });

  it('lista las fechas del mentor en el rango, incluyendo ambos extremos y ordenadas', async () => {
    const last = new Date('2026-11-01T00:00:00.000Z');
    await repository.findInRange('mentor-1', DAY, last);
    expect(prisma.blockedDate.findMany).toHaveBeenCalledWith({
      where: { mentorId: 'mentor-1', blockedOn: { gte: DAY, lte: last } },
      orderBy: { blockedOn: 'asc' },
    });
  });

  it.each([
    [{ id: 'block-1' }, true],
    [null, false],
  ])('con %o como primer bloque con cita activa responde %s', async (found, expected) => {
    const from = new Date('2026-10-27T04:00:00.000Z');
    const to = new Date('2026-10-28T04:00:00.000Z');
    tx.availabilityBlock.findFirst.mockResolvedValue(found);

    await expect(repository.hasActiveAppointmentBetween('mentor-1', from, to, tx as never)).resolves.toBe(expected);
    expect(tx.availabilityBlock.findFirst).toHaveBeenCalledWith({
      where: {
        mentorId: 'mentor-1',
        startAt: { gte: from, lt: to },
        appointments: { some: { status: { title: { in: ACTIVE_APPOINTMENT_STATUSES } } } },
      },
      select: { id: true },
    });
  });

  it('crea la fecha bloqueada con el cliente indicado', async () => {
    await repository.create('mentor-1', DAY, null, tx as never);
    expect(tx.blockedDate.create).toHaveBeenCalledWith({
      data: { mentorId: 'mentor-1', blockedOn: DAY, reason: null },
    });
  });

  it('crea con el cliente por defecto si no recibe uno', async () => {
    await repository.create('mentor-1', DAY, 'Congreso');
    expect(prisma.blockedDate.create).toHaveBeenCalledWith({
      data: { mentorId: 'mentor-1', blockedOn: DAY, reason: 'Congreso' },
    });
  });

  it('busca citas activas con el cliente por defecto si no recibe uno', async () => {
    prisma.availabilityBlock.findFirst.mockResolvedValue(null);
    await expect(repository.hasActiveAppointmentBetween('mentor-1', DAY, DAY)).resolves.toBe(false);
    expect(prisma.availabilityBlock.findFirst).toHaveBeenCalled();
  });

  it('actualiza el motivo con el cliente indicado o con el de por defecto', async () => {
    await repository.updateReason('blocked-1', 'Congreso', tx as never);
    expect(tx.blockedDate.update).toHaveBeenCalledWith({ where: { id: 'blocked-1' }, data: { reason: 'Congreso' } });

    await repository.updateReason('blocked-1', 'Feria');
    expect(prisma.blockedDate.update).toHaveBeenCalledWith({ where: { id: 'blocked-1' }, data: { reason: 'Feria' } });
  });

  it('borra por id', async () => {
    await repository.delete('blocked-1');
    expect(prisma.blockedDate.delete).toHaveBeenCalledWith({ where: { id: 'blocked-1' } });
  });
});
