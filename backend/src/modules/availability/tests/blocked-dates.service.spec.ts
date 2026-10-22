import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma, type BlockedDate } from '../../../prisma/client.js';
import {
  BlockedDateHasAppointmentException,
  BlockedDateInPastException,
  BlockedDateNotFoundException,
  BlockedDateNotOwnedException,
  DayBlockedException,
} from '../exceptions/index.js';
import { BlockedDateMapper } from '../mappers/blocked-date.mapper.js';
import { BlockedDatesService } from '../services/blocked-dates.service.js';

const NOW = new Date('2026-10-22T15:00:00.000Z');
const TX = { kind: 'tx' };

const record = (overrides: Partial<BlockedDate> = {}): BlockedDate => ({
  id: 'blocked-1',
  mentorId: 'mentor-1',
  blockedOn: new Date('2026-10-27T00:00:00.000Z'),
  reason: null,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

describe('BlockedDatesService', () => {
  const repository = {
    withDayLock: vi.fn(),
    findByDay: vi.fn(),
    findById: vi.fn(),
    findInRange: vi.fn(),
    hasActiveAppointmentBetween: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  };
  let service: BlockedDatesService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ now: NOW });
    repository.withDayLock.mockImplementation((_mentorId, _day, work) => work(TX));
    repository.findByDay.mockResolvedValue(null);
    repository.hasActiveAppointmentBetween.mockResolvedValue(false);
    repository.create.mockImplementation(async (mentorId, blockedOn, reason) => record({ mentorId, blockedOn, reason }));
    repository.findInRange.mockResolvedValue([]);
    repository.delete.mockResolvedValue(record());
    service = new BlockedDatesService(repository as never, new BlockedDateMapper());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('blockDate', () => {
    it('bloquea un día futuro dentro del lock del mentor y ese día', async () => {
      const result = await service.blockDate('mentor-1', { blockedOn: '2026-10-27', reason: 'Congreso' });

      expect(result).toMatchObject({ mentorId: 'mentor-1', blockedOn: '2026-10-27', reason: 'Congreso' });
      expect(repository.withDayLock).toHaveBeenCalledWith('mentor-1', '2026-10-27', expect.any(Function));
      expect(repository.create).toHaveBeenCalledWith(
        'mentor-1',
        new Date('2026-10-27T00:00:00.000Z'),
        'Congreso',
        TX,
      );
    });

    it('revisa las citas confirmadas de todo el día de Bolivia dentro de la transacción', async () => {
      await service.blockDate('mentor-1', { blockedOn: '2026-10-27', reason: null });

      expect(repository.hasActiveAppointmentBetween).toHaveBeenCalledWith(
        'mentor-1',
        new Date('2026-10-27T04:00:00.000Z'),
        new Date('2026-10-28T04:00:00.000Z'),
        TX,
      );
    });

    it('permite bloquear el día de hoy (hora de Bolivia)', async () => {
      await expect(service.blockDate('mentor-1', { blockedOn: '2026-10-22', reason: null })).resolves.toMatchObject({
        blockedOn: '2026-10-22',
      });
    });

    it('rechaza una fecha pasada con 400 sin tocar la base', async () => {
      await expect(service.blockDate('mentor-1', { blockedOn: '2026-10-21', reason: null })).rejects.toBeInstanceOf(
        BlockedDateInPastException,
      );
      expect(repository.withDayLock).not.toHaveBeenCalled();
    });

    it('usa el día de Bolivia aunque en UTC ya sea el día siguiente', async () => {
      vi.setSystemTime(new Date('2026-10-23T02:00:00.000Z'));
      await expect(service.blockDate('mentor-1', { blockedOn: '2026-10-22', reason: null })).resolves.toBeDefined();
    });

    it('responde 409 y no crea nada si el día tiene una cita confirmada', async () => {
      repository.hasActiveAppointmentBetween.mockResolvedValue(true);

      await expect(service.blockDate('mentor-1', { blockedOn: '2026-10-27', reason: null })).rejects.toMatchObject({
        statusCode: 409,
        message: 'No puedes bloquear un día con citas confirmadas',
      });
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('si la fecha ya estaba bloqueada devuelve el bloqueo existente sin duplicarlo', async () => {
      repository.findByDay.mockResolvedValue(record({ reason: 'Motivo original' }));

      const result = await service.blockDate('mentor-1', { blockedOn: '2026-10-27', reason: 'Otro motivo' });

      expect(result).toMatchObject({ id: 'blocked-1', reason: 'Motivo original' });
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.hasActiveAppointmentBetween).not.toHaveBeenCalled();
    });

    it('lanza la excepción de dominio que corresponde', async () => {
      repository.hasActiveAppointmentBetween.mockResolvedValue(true);
      await expect(service.blockDate('mentor-1', { blockedOn: '2026-10-27', reason: null })).rejects.toBeInstanceOf(
        BlockedDateHasAppointmentException,
      );
    });
  });

  describe('unblockDate', () => {
    it('responde 404 si la fecha bloqueada no existe', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.unblockDate('mentor-1', 'blocked-1')).rejects.toBeInstanceOf(BlockedDateNotFoundException);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('responde 403 y no borra nada si la fecha es de otro mentor', async () => {
      repository.findById.mockResolvedValue(record({ mentorId: 'otro-mentor' }));
      await expect(service.unblockDate('mentor-1', 'blocked-1')).rejects.toBeInstanceOf(BlockedDateNotOwnedException);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('responde 404 si otra solicitud la desbloqueó justo antes (P2025)', async () => {
      repository.findById.mockResolvedValue(record());
      repository.delete.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Record not found', { code: 'P2025', clientVersion: 'test' }),
      );

      await expect(service.unblockDate('mentor-1', 'blocked-1')).rejects.toBeInstanceOf(
        BlockedDateNotFoundException,
      );
    });

    it('relanza otros errores de la base al desbloquear', async () => {
      const failure = new Error('connection lost');
      repository.findById.mockResolvedValue(record());
      repository.delete.mockRejectedValue(failure);

      await expect(service.unblockDate('mentor-1', 'blocked-1')).rejects.toBe(failure);
    });

    it('desbloquea la fecha propia y devuelve su id', async () => {
      repository.findById.mockResolvedValue(record());
      await expect(service.unblockDate('mentor-1', 'blocked-1')).resolves.toEqual({ id: 'blocked-1' });
      expect(repository.delete).toHaveBeenCalledWith('blocked-1');
    });
  });

  describe('findBlockedDates', () => {
    it('lista los días de Bolivia del rango semiabierto [from, to)', async () => {
      repository.findInRange.mockResolvedValue([record()]);

      const result = await service.findBlockedDates('mentor-1', {
        from: '2026-10-26T04:00:00.000Z',
        to: '2026-11-02T04:00:00.000Z',
      });

      expect(repository.findInRange).toHaveBeenCalledWith(
        'mentor-1',
        new Date('2026-10-26T00:00:00.000Z'),
        new Date('2026-11-01T00:00:00.000Z'),
      );
      expect(result.map((item) => item.blockedOn)).toEqual(['2026-10-27']);
    });

    it('acepta el fin de semana a las 23:59:59.999 de Bolivia', async () => {
      await service.findBlockedDates('mentor-1', {
        from: '2026-10-26T04:00:00.000Z',
        to: '2026-11-02T03:59:59.999Z',
      });
      expect(repository.findInRange.mock.calls[0][2]).toEqual(new Date('2026-11-01T00:00:00.000Z'));
    });
  });

  describe('findBlockedDays', () => {
    it('devuelve los días bloqueados como AAAA-MM-DD', async () => {
      repository.findInRange.mockResolvedValue([
        record(),
        record({ id: 'blocked-2', blockedOn: new Date('2026-10-29T00:00:00.000Z') }),
      ]);

      const days = await service.findBlockedDays(
        'mentor-1',
        new Date('2026-10-26T04:00:00.000Z'),
        new Date('2026-11-02T03:59:59.999Z'),
      );

      expect([...days]).toEqual(['2026-10-27', '2026-10-29']);
    });
  });

  describe('withDayLock', () => {
    it('delega el lock del mentor y el día en el repositorio', async () => {
      const work = vi.fn().mockResolvedValue('hecho');

      await expect(service.withDayLock('mentor-1', '2026-10-27', work)).resolves.toBe('hecho');

      expect(repository.withDayLock).toHaveBeenCalledWith('mentor-1', '2026-10-27', work);
      expect(work).toHaveBeenCalledWith(TX);
    });
  });

  describe('assertDayNotBlocked', () => {
    it('no hace nada si el día del bloque no está bloqueado', async () => {
      await expect(
        service.assertDayNotBlocked('mentor-1', new Date('2026-10-27T22:00:00.000Z')),
      ).resolves.toBeUndefined();
      expect(repository.findByDay).toHaveBeenCalledWith(
        'mentor-1',
        new Date('2026-10-27T00:00:00.000Z'),
        undefined,
      );
    });

    it('lanza 409 «Ese día está bloqueado» si el día de Bolivia del bloque está bloqueado', async () => {
      repository.findByDay.mockResolvedValue(record());
      await expect(
        service.assertDayNotBlocked('mentor-1', new Date('2026-10-28T01:00:00.000Z')),
      ).rejects.toBeInstanceOf(DayBlockedException);
      expect(repository.findByDay.mock.calls[0][1]).toEqual(new Date('2026-10-27T00:00:00.000Z'));
    });

    it('usa el cliente de transacción que recibe', async () => {
      await service.assertDayNotBlocked('mentor-1', new Date('2026-10-27T22:00:00.000Z'), TX as never);
      expect(repository.findByDay.mock.calls[0][2]).toBe(TX);
    });
  });
});
