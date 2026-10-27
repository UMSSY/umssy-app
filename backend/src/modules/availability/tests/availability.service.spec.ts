import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toBoliviaTime } from '../../../common/utils/date-time.js';
import { AppointmentStatusTitle } from '../enums/appointment-status-title.enum.js';
import { AvailabilityMapper } from '../mappers/availability.mapper.js';
import {
  BlockHasAppointmentException,
  BlockNotFoundException,
  BlockNotOwnedException,
  BlockOverlapException,
  DayBlockedException,
  MentorAvailabilityNotOwnedException,
} from '../exceptions/index.js';
import { AvailabilityService } from '../services/availability.service.js';
import { MentorNotFoundException } from '../../mentors/exceptions/mentor-not-found.exception.js';
import type { CreateBlockDto } from '../requests/create-block.request.js';

const QUERY = { from: '2026-10-05T04:00:00.000Z', to: '2026-10-12T03:59:59.999Z' };

const UPDATE_PAYLOAD = {
  startAt: new Date('2026-10-10T14:00:00.000Z'),
  endAt: new Date('2026-10-10T14:30:00.000Z'),
};

const block = (id: string, statuses: string[] = [], mentorId = 'mentor-1') => ({
  id,
  mentorId,
  startAt: new Date('2026-10-06T22:00:00.000Z'),
  endAt: new Date('2026-10-06T22:30:00.000Z'),
  seriesId: null,
  repeatUntil: null,
  createdAt: new Date('2026-10-01T12:00:00.000Z'),
  updatedAt: new Date('2026-10-01T12:00:00.000Z'),
  appointments: statuses.map((title) => ({ status: { title } })),
});

describe('AvailabilityService', () => {
  const availabilityRepository = {
    findMentorBlocksInRange: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    findMentorFreeBlocksInRange: vi.fn(),
    create: vi.fn(),
  };
  const mentorId = 'ed9934b9-1a4e-4b8d-bbed-b8772154cba8';
  const payload = {
    startAt: new Date('2026-11-03T22:00:00.000Z'),
    endAt: new Date('2026-11-04T00:00:00.000Z'),
  } satisfies CreateBlockDto;
  const savedBlock = {
    id: 'a3f1c2d4-0000-4000-8000-000000000001',
    mentorId,
    startAt: payload.startAt,
    endAt: payload.endAt,
    seriesId: null,
    repeatUntil: null,
    createdAt: new Date('2026-11-01T12:00:00.000Z'),
    updatedAt: new Date('2026-11-01T12:00:00.000Z'),
  };
  const mentorsService = { findOne: vi.fn(), updateAvailability: vi.fn() };
  const blockedDatesService = {
    assertDayNotBlocked: vi.fn(),
    findBlockedDays: vi.fn(),
    runOnUnblockedDay: vi.fn(),
  };
  const TX = { kind: 'tx' };
  let service: AvailabilityService;

  beforeEach(() => {
    vi.clearAllMocks();
    availabilityRepository.findMentorBlocksInRange.mockResolvedValue([]);
    availabilityRepository.create.mockResolvedValue(savedBlock);
    blockedDatesService.assertDayNotBlocked.mockResolvedValue(undefined);
    blockedDatesService.findBlockedDays.mockResolvedValue(new Set());
    blockedDatesService.runOnUnblockedDay.mockImplementation(async (mentor, startAt, work) => {
      await blockedDatesService.assertDayNotBlocked(mentor, startAt, TX);
      return work(TX);
    });
    service = new AvailabilityService(
      availabilityRepository as never,
      new AvailabilityMapper(),
      mentorsService as never,
      blockedDatesService as never,
    );
  });

  describe('findBlockWithAppointments', () => {
    it('lee el bloque con sus citas activas dentro de la transacción recibida', async () => {
      const stored = block('block-1', [AppointmentStatusTitle.CONFIRMED]);
      availabilityRepository.findById.mockResolvedValue(stored);

      await expect(service.findBlockWithAppointments('block-1', TX as never)).resolves.toBe(stored);
      expect(availabilityRepository.findById).toHaveBeenCalledExactlyOnceWith('block-1', TX);
    });

    it('devuelve null si el bloque no existe', async () => {
      availabilityRepository.findById.mockResolvedValue(null);

      await expect(service.findBlockWithAppointments('missing')).resolves.toBeNull();
      expect(availabilityRepository.findById).toHaveBeenCalledExactlyOnceWith('missing', undefined);
    });
  });

  describe('findMyBlocks', () => {
    it('consulta solo los bloques del mentor en sesión dentro del rango pedido', async () => {
      await service.findMyBlocks('mentor-1', QUERY);

      expect(availabilityRepository.findMentorBlocksInRange).toHaveBeenCalledWith(
        'mentor-1',
        new Date(QUERY.from),
        new Date(QUERY.to),
      );
    });

    it('devuelve los bloques mapeados con su estado', async () => {
      availabilityRepository.findMentorBlocksInRange.mockResolvedValue([
        block('block-1'),
        {
          ...block('block-2'),
          appointments: [
            {
              id: 'appointment-1',
              status: { title: AppointmentStatusTitle.CONFIRMED },
              student: { id: 'student-1', firstName: 'Luis', lastName: 'Flores' },
              orientationType: null,
            },
          ],
        },
      ]);

      const result = await service.findMyBlocks('mentor-1', QUERY);

      expect(result.map((item) => [item.id, item.state])).toEqual([
        ['block-1', 'free'],
        ['block-2', 'confirmed'],
      ]);
    });

    it('incluye quién reservó y el tema en los bloques con cita', async () => {
      availabilityRepository.findMentorBlocksInRange.mockResolvedValue([
        block('block-1'),
        {
          ...block('block-2'),
          appointments: [
            {
              id: 'appointment-1',
              status: { title: AppointmentStatusTitle.CONFIRMED },
              student: { id: 'student-1', firstName: 'Luis', lastName: 'Flores' },
              orientationType: { id: 'orientation-1', name: 'Orientación profesional' },
            },
          ],
        },
      ]);

      const result = await service.findMyBlocks('mentor-1', QUERY);

      expect(result.map((item) => item.appointment)).toEqual([
        null,
        {
          id: 'appointment-1',
          counterpart: { id: 'student-1', fullName: 'Luis Flores' },
          orientationType: { id: 'orientation-1', name: 'Orientación profesional' },
        },
      ]);
    });

    it('devuelve una lista vacía si el mentor no tiene bloques en la semana', async () => {
      await expect(service.findMyBlocks('mentor-1', QUERY)).resolves.toEqual([]);
    });
  });

  describe('updateBlock', () => {
    it('responde 404 si el bloque no existe', async () => {
      availabilityRepository.findById.mockResolvedValue(null);

      await expect(service.updateBlock('mentor-1', 'block-1', UPDATE_PAYLOAD)).rejects.toThrow(
        BlockNotFoundException,
      );
      expect(availabilityRepository.update).not.toHaveBeenCalled();
    });

    it('responde 403 y no toca nada si el bloque es de otro mentor', async () => {
      availabilityRepository.findById.mockResolvedValue(block('block-1', [], 'otro-mentor'));

      await expect(service.updateBlock('mentor-1', 'block-1', UPDATE_PAYLOAD)).rejects.toThrow(
        BlockNotOwnedException,
      );
      expect(availabilityRepository.update).not.toHaveBeenCalled();
    });

    it('responde 409 si el bloque tiene una cita confirmada', async () => {
      availabilityRepository.findById.mockResolvedValue(block('block-1', [AppointmentStatusTitle.CONFIRMED]));

      await expect(service.updateBlock('mentor-1', 'block-1', UPDATE_PAYLOAD)).rejects.toThrow(
        BlockHasAppointmentException,
      );
      expect(availabilityRepository.update).not.toHaveBeenCalled();
    });

    it('actualiza un bloque propio sin citas y devuelve el bloque mapeado', async () => {
      availabilityRepository.findById.mockResolvedValue(block('block-1'));
      availabilityRepository.update.mockResolvedValue(
        block('block-1', [], 'mentor-1'),
      );

      const result = await service.updateBlock('mentor-1', 'block-1', UPDATE_PAYLOAD);

      expect(availabilityRepository.update).toHaveBeenCalledWith(
        'block-1',
        { startAt: UPDATE_PAYLOAD.startAt, endAt: UPDATE_PAYLOAD.endAt },
        TX,
      );
      expect(result.id).toBe('block-1');
      expect(result.state).toBe('free');
    });

    it('si el bloque cambia de día, lo mueve dentro del lock y revisa el día de destino', async () => {
      availabilityRepository.findById.mockResolvedValue(block('block-1'));
      availabilityRepository.update.mockResolvedValue(block('block-1'));

      await service.updateBlock('mentor-1', 'block-1', UPDATE_PAYLOAD);

      expect(toBoliviaTime(block('block-1').startAt).date).not.toBe(toBoliviaTime(UPDATE_PAYLOAD.startAt).date);
      expect(blockedDatesService.runOnUnblockedDay).toHaveBeenCalledWith(
        'mentor-1',
        UPDATE_PAYLOAD.startAt,
        expect.any(Function),
      );
      expect(blockedDatesService.assertDayNotBlocked).toHaveBeenCalledWith(
        'mentor-1',
        UPDATE_PAYLOAD.startAt,
        TX,
      );
    });

    it('responde 409 y no mueve el bloque si el día de destino está bloqueado', async () => {
      availabilityRepository.findById.mockResolvedValue(block('block-1'));
      blockedDatesService.assertDayNotBlocked.mockRejectedValue(new DayBlockedException());

      await expect(service.updateBlock('mentor-1', 'block-1', UPDATE_PAYLOAD)).rejects.toBeInstanceOf(
        DayBlockedException,
      );
      expect(availabilityRepository.update).not.toHaveBeenCalled();
    });

    it('edita sin lock si el bloque no cambia de día, aunque ese día esté bloqueado', async () => {
      const sameDay = {
        ...block('block-1'),
        startAt: new Date('2026-10-10T20:00:00.000Z'),
        endAt: new Date('2026-10-10T20:30:00.000Z'),
      };
      availabilityRepository.findById.mockResolvedValue(sameDay);
      availabilityRepository.update.mockResolvedValue(sameDay);
      blockedDatesService.assertDayNotBlocked.mockRejectedValue(new DayBlockedException());

      await service.updateBlock('mentor-1', 'block-1', UPDATE_PAYLOAD);

      expect(blockedDatesService.runOnUnblockedDay).not.toHaveBeenCalled();
      expect(availabilityRepository.update).toHaveBeenCalledWith(
        'block-1',
        { startAt: UPDATE_PAYLOAD.startAt, endAt: UPDATE_PAYLOAD.endAt },
        undefined,
      );
    });

    it('responde 409 si el guardado choca con la constraint de no-solape', async () => {
      availabilityRepository.findById.mockResolvedValue(block('block-1'));
      availabilityRepository.update.mockRejectedValue({ code: '23P01' });

      await expect(service.updateBlock('mentor-1', 'block-1', UPDATE_PAYLOAD)).rejects.toThrow(
        BlockOverlapException,
      );
    });

    it('relanza el error original cuando no es de solapamiento', async () => {
      availabilityRepository.findById.mockResolvedValue(block('block-1'));
      const databaseError = new Error('connection refused');
      availabilityRepository.update.mockRejectedValue(databaseError);

      await expect(service.updateBlock('mentor-1', 'block-1', UPDATE_PAYLOAD)).rejects.toBe(databaseError);
    });
  });

  describe('create', () => {
    it('crea cuatro bloques con el mismo UUID de serie y fin de repetición', async () => {
      const result = await service.create(mentorId, { ...payload, repeatWeekly: true, repeatUntil: '2026-11-24' });
      expect(result).toEqual({ created: 4, skipped: [] });
      const calls = availabilityRepository.create.mock.calls;
      expect(calls).toHaveLength(4);
      const series = calls[0][4];
      expect(series).toEqual({ seriesId: expect.stringMatching(/^[\da-f-]{36}$/), repeatUntil: new Date('2026-11-24') });
      expect(new Set(calls.map((call) => call[4].seriesId)).size).toBe(1);
      expect(calls.map((call) => toBoliviaTime(call[1]).date)).toEqual([
        '2026-11-03', '2026-11-10', '2026-11-17', '2026-11-24',
      ]);
      for (const call of calls) {
        expect(call[0]).toBe(mentorId);
        expect(call[3]).toBe(TX);
        expect(call[2].getTime() - call[1].getTime()).toBe(2 * 60 * 60_000);
      }
    });

    it('omite conflictos sin interrumpir las siguientes semanas', async () => {
      availabilityRepository.create.mockRejectedValueOnce({ code: '23P01' });
      blockedDatesService.assertDayNotBlocked.mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new DayBlockedException());
      await expect(service.create(mentorId, {
        ...payload, repeatWeekly: true, repeatUntil: '2026-11-24',
      })).resolves.toEqual({ created: 2, skipped: ['2026-11-03', '2026-11-10'] });
    });

    it('informa todas las fechas si todas se omiten', async () => {
      availabilityRepository.create.mockRejectedValue({ code: '23P01' });
      await expect(service.create(mentorId, {
        ...payload, repeatWeekly: true, repeatUntil: '2026-11-10',
      })).resolves.toEqual({ created: 0, skipped: ['2026-11-03', '2026-11-10'] });
    });

    it('no convierte errores inesperados en omisiones', async () => {
      const error = new Error('database unavailable');
      availabilityRepository.create.mockRejectedValue(error);
      await expect(service.create(mentorId, {
        ...payload, repeatWeekly: true, repeatUntil: '2026-11-10',
      })).rejects.toBe(error);
    });

    it('mantiene la respuesta individual si repeatWeekly es false', async () => {
      await expect(service.create(mentorId, { ...payload, repeatWeekly: false })).resolves.toMatchObject({ id: savedBlock.id });
      expect(availabilityRepository.create).toHaveBeenCalledTimes(1);
    });

    it('responde 409 sin guardar el bloque si el día está bloqueado', async () => {
      blockedDatesService.assertDayNotBlocked.mockRejectedValue(new DayBlockedException());

      await expect(service.create(mentorId, payload)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Ese día está bloqueado',
      });
      expect(blockedDatesService.runOnUnblockedDay).toHaveBeenCalledWith(mentorId, payload.startAt, expect.any(Function));
      expect(blockedDatesService.assertDayNotBlocked).toHaveBeenCalledWith(mentorId, payload.startAt, TX);
      expect(availabilityRepository.create).not.toHaveBeenCalled();
    });

    it('crea el bloque y lo devuelve libre', async () => {
      const result = await service.create(mentorId, payload);

      expect(result).toEqual({
        id: savedBlock.id,
        mentorId,
        startAt: savedBlock.startAt.toISOString(),
        endAt: savedBlock.endAt.toISOString(),
        state: 'free',
        createdAt: savedBlock.createdAt.toISOString(),
        updatedAt: savedBlock.updatedAt.toISOString(),
      });
    });

    it('pasa al repositorio el mentor y las fechas ya convertidas a Date', async () => {
      await service.create(mentorId, payload);

      expect(availabilityRepository.create).toHaveBeenCalledWith(
        mentorId,
        payload.startAt,
        payload.endAt,
        TX,
      );
      expect(payload.startAt).toBeInstanceOf(Date);
    });

    it.each([
      ['code', { code: '23P01' }],
      ['meta', { meta: { code: '23P01' } }],
      ['message', { message: 'Query failed: conflicting key 23P01' }],
      // Shape real verificado contra Postgres: ver utils/overlap-error.ts.
      ['driverAdapterError', { code: 'P2039', meta: { driverAdapterError: { cause: { code: '23P01' } } } }],
    ])('lanza BlockOverlapException cuando el 23P01 viene en %s', async (_source, errorShape) => {
      availabilityRepository.create.mockRejectedValue(Object.assign(new Error('db'), errorShape));

      await expect(service.create(mentorId, payload)).rejects.toBeInstanceOf(BlockOverlapException);
    });

    it('responde 409 con el mensaje de la historia de usuario', async () => {
      availabilityRepository.create.mockRejectedValue({ code: '23P01' });

      await expect(service.create(mentorId, payload)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Ya tienes un bloque en ese horario',
      });
    });

    it('relanza el error original cuando no es de solapamiento', async () => {
      const databaseError = new Error('connection refused');
      availabilityRepository.create.mockRejectedValue(databaseError);

      await expect(service.create(mentorId, payload)).rejects.toBe(databaseError);
    });
  });

  describe('remove', () => {
    const repository = { findById: vi.fn(), delete: vi.fn() };
    let removeService: AvailabilityService;

    beforeEach(() => {
      vi.clearAllMocks();
      removeService = new AvailabilityService(
        repository as never,
        new AvailabilityMapper(),
        mentorsService as never,
        blockedDatesService as never,
      );
    });

    it('lanza 404 si el bloque no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(removeService.remove('mentor-1', 'block-x')).rejects.toThrow(BlockNotFoundException);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('lanza 403 si el bloque pertenece a otro mentor', async () => {
      repository.findById.mockResolvedValue(block('block-x'));

      await expect(removeService.remove('otro-mentor', 'block-x')).rejects.toThrow(BlockNotOwnedException);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('lanza 409 si el bloque tiene citas activas', async () => {
      repository.findById.mockResolvedValue(block('block-x', [AppointmentStatusTitle.CONFIRMED]));

      await expect(removeService.remove('mentor-1', 'block-x')).rejects.toThrow(BlockHasAppointmentException);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('elimina el bloque y devuelve su id', async () => {
      const target = block('block-x');
      repository.findById.mockResolvedValue(target);
      repository.delete.mockResolvedValue(target);

      await expect(removeService.remove('mentor-1', 'block-x')).resolves.toEqual({ id: 'block-x' });
      expect(repository.delete).toHaveBeenCalledWith('block-x');
    });
  });

  describe('findMentorFreeBlocks', () => {
    beforeEach(() => {
      mentorsService.findOne.mockResolvedValue({ id: 'mentor-1' });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('responde 404 sin consultar bloques si el mentor no existe o no está activo', async () => {
      mentorsService.findOne.mockRejectedValue(new MentorNotFoundException());

      await expect(service.findMentorFreeBlocks('mentor-1', QUERY)).rejects.toBeInstanceOf(
        MentorNotFoundException,
      );
      expect(mentorsService.findOne).toHaveBeenCalledWith('mentor-1');
      expect(availabilityRepository.findMentorFreeBlocksInRange).not.toHaveBeenCalled();
    });

    it('consulta desde el inicio del rango cuando todavía no empezó', async () => {
      vi.useFakeTimers({ now: new Date('2026-10-01T12:00:00.000Z') });
      availabilityRepository.findMentorFreeBlocksInRange.mockResolvedValue([]);

      await service.findMentorFreeBlocks('mentor-1', QUERY);

      expect(availabilityRepository.findMentorFreeBlocksInRange).toHaveBeenCalledWith(
        'mentor-1',
        new Date(QUERY.from),
        new Date(QUERY.to),
      );
    });

    it('consulta desde ahora para no devolver bloques pasados', async () => {
      const now = new Date('2026-10-07T15:30:00.000Z');
      vi.useFakeTimers({ now });
      availabilityRepository.findMentorFreeBlocksInRange.mockResolvedValue([]);

      await service.findMentorFreeBlocks('mentor-1', QUERY);

      expect(availabilityRepository.findMentorFreeBlocksInRange).toHaveBeenCalledWith(
        'mentor-1',
        now,
        new Date(QUERY.to),
      );
    });

    it('devuelve una lista vacía sin consultar si todo el rango ya pasó', async () => {
      vi.useFakeTimers({ now: new Date('2026-10-20T12:00:00.000Z') });

      await expect(service.findMentorFreeBlocks('mentor-1', QUERY)).resolves.toEqual([]);
      expect(availabilityRepository.findMentorFreeBlocksInRange).not.toHaveBeenCalled();
    });

    it('no ofrece los bloques de los días bloqueados, según el día de Bolivia', async () => {
      vi.useFakeTimers({ now: new Date('2026-10-01T12:00:00.000Z') });
      availabilityRepository.findMentorFreeBlocksInRange.mockResolvedValue([
        block('tuesday'),
        {
          ...block('wednesday-night'),
          startAt: new Date('2026-10-08T00:30:00.000Z'),
          endAt: new Date('2026-10-08T01:00:00.000Z'),
        },
        {
          ...block('thursday'),
          startAt: new Date('2026-10-08T14:00:00.000Z'),
          endAt: new Date('2026-10-08T15:00:00.000Z'),
        },
      ]);
      blockedDatesService.findBlockedDays.mockResolvedValue(new Set(['2026-10-07']));

      const result = await service.findMentorFreeBlocks('mentor-1', QUERY);

      expect(result.map((item) => item.id)).toEqual(['tuesday', 'thursday']);
      expect(blockedDatesService.findBlockedDays).toHaveBeenCalledWith(
        'mentor-1',
        new Date(QUERY.from),
        new Date(QUERY.to),
      );
    });

    it('devuelve los bloques libres mapeados sin datos de citas', async () => {
      vi.useFakeTimers({ now: new Date('2026-10-01T12:00:00.000Z') });
      availabilityRepository.findMentorFreeBlocksInRange.mockResolvedValue([block('block-1')]);

      const [result] = await service.findMentorFreeBlocks('mentor-1', QUERY);

      expect(result.state).toBe('free');
      expect(result).not.toHaveProperty('appointments');
    });
  });

  describe('findMyAvailabilityStatus', () => {
    it('lee el estado con el servicio de mentores de Epic 6', async () => {
      mentorsService.findOne.mockResolvedValue({ id: mentorId, isAvailable: false });

      await expect(service.findMyAvailabilityStatus(mentorId)).resolves.toEqual({ mentorId, isAvailable: false });
      expect(mentorsService.findOne).toHaveBeenCalledWith(mentorId);
    });

    it('propaga el 404 si el usuario no es un mentor activo', async () => {
      mentorsService.findOne.mockRejectedValue(new MentorNotFoundException());

      await expect(service.findMyAvailabilityStatus(mentorId)).rejects.toBeInstanceOf(MentorNotFoundException);
    });
  });

  describe('updateAvailabilityStatus', () => {
    it.each([true, false])('guarda isAvailable=%s con el servicio de Epic 6', async (isAvailable) => {
      mentorsService.updateAvailability.mockResolvedValue({ id: mentorId, isAvailableForMentoring: isAvailable });

      await expect(service.updateAvailabilityStatus(mentorId, mentorId, isAvailable)).resolves.toEqual({
        mentorId,
        isAvailable,
      });
      expect(mentorsService.updateAvailability).toHaveBeenCalledWith(mentorId, isAvailable);
    });

    it('no toca bloques, citas ni fechas bloqueadas al pausar', async () => {
      mentorsService.updateAvailability.mockResolvedValue({ id: mentorId, isAvailableForMentoring: false });

      await service.updateAvailabilityStatus(mentorId, mentorId, false);

      for (const method of Object.values(availabilityRepository)) {
        expect(method).not.toHaveBeenCalled();
      }
    });

    it('rechaza con 403 cambiar la disponibilidad de otro mentor', async () => {
      await expect(service.updateAvailabilityStatus(mentorId, 'otro-mentor', false)).rejects.toBeInstanceOf(
        MentorAvailabilityNotOwnedException,
      );
      expect(mentorsService.updateAvailability).not.toHaveBeenCalled();
    });
  });
});
