import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import {
  DayBlockedException,
  DayBusyException,
} from '../../availability/exceptions/index.js';
import { MentorNotFoundException } from '../../mentors/exceptions/mentor-not-found.exception.js';
import {
  AppointmentOverlapException,
  BlockAlreadyBookedException,
  BlockInPastException,
  DailyAppointmentLimitException,
  InvalidOrientationTypeException,
  MentorUnavailableException,
  OwnBlockException,
  SlotUnavailableException,
} from '../exceptions/index.js';
import { AppointmentDocumentMapper } from '../mappers/appointment-document.mapper.js';
import { AppointmentMapper } from '../mappers/appointment.mapper.js';
import type { CreateAppointmentDto } from '../requests/create-appointment.request.js';
import { AppointmentsService } from '../services/appointments.service.js';
import {
  APPOINTMENT_ID,
  createAppointmentRecord,
  MENTOR_ID,
  NOW,
  STUDENT_ID,
} from './fixtures/appointment-record.fixture.js';

const BLOCK_ID = '55555555-5555-4555-8555-555555555555';
const TOPIC_ID = '66666666-6666-4666-8666-666666666666';
const STATUS_ID = '77777777-7777-4777-8777-777777777777';
const TX = { kind: 'tx' };

const block = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  id: BLOCK_ID,
  mentorId: MENTOR_ID,
  startAt: new Date(Date.now() + 60 * 60 * 1000),
  endAt: new Date(Date.now() + 90 * 60 * 1000),
  seriesId: null,
  repeatUntil: null,
  createdAt: new Date('2026-10-01T12:00:00.000Z'),
  updatedAt: new Date('2026-10-01T12:00:00.000Z'),
  appointments: [],
  ...overrides,
});

describe('AppointmentsService', () => {
  const appointmentsRepository = {
    findStatusIdByTitle: vi.fn(),
    createAppointment: vi.fn(),
    createAppointmentHistory: vi.fn(),
    lockParticipants: vi.fn(),
    hasOverlappingAppointment: vi.fn(),
    hasReservationOnDay: vi.fn(),
  };
  const availabilityService = { findBlockWithAppointments: vi.fn() };
  const blockedDatesService = { runOnUnblockedDay: vi.fn() };
  const mentorsService = { findOne: vi.fn() };
  const user = {
    id: STUDENT_ID,
    email: 'student@test.com',
    roles: ['estudiante'],
  };
  const payload: CreateAppointmentDto = {
    blockId: BLOCK_ID,
    orientationTypeId: TOPIC_ID,
    message: 'Quiero reforzar mis bases',
  };
  let service: AppointmentsService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    availabilityService.findBlockWithAppointments.mockResolvedValue(block());
    mentorsService.findOne.mockResolvedValue({
      id: MENTOR_ID,
      isAvailable: true,
      orientationTypes: [
        { id: TOPIC_ID, name: 'Orientación profesional', description: null },
      ],
    });
    blockedDatesService.runOnUnblockedDay.mockImplementation(
      async (
        _mentorId: string,
        _startAt: Date,
        work: (tx: unknown) => Promise<unknown>,
      ) => work(TX),
    );
    appointmentsRepository.findStatusIdByTitle.mockResolvedValue(STATUS_ID);
    appointmentsRepository.hasOverlappingAppointment.mockResolvedValue(false);
    appointmentsRepository.hasReservationOnDay.mockResolvedValue(false);
    appointmentsRepository.createAppointment.mockResolvedValue(
      createAppointmentRecord(),
    );
    service = new AppointmentsService(
      appointmentsRepository as never,
      new AppointmentMapper(new AppointmentDocumentMapper()),
      availabilityService as never,
      blockedDatesService as never,
      mentorsService as never,
      {} as never,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('crea la cita confirmada dentro del candado del día con los datos del bloque', async () => {
    const createdBlock = block();
    availabilityService.findBlockWithAppointments
      .mockResolvedValueOnce(createdBlock)
      .mockResolvedValueOnce(createdBlock);

    const result = await service.create(user, payload);

    expect(blockedDatesService.runOnUnblockedDay).toHaveBeenCalledWith(
      MENTOR_ID,
      createdBlock.startAt,
      expect.any(Function),
    );
    expect(
      availabilityService.findBlockWithAppointments,
    ).toHaveBeenLastCalledWith(BLOCK_ID, TX);
    expect(appointmentsRepository.findStatusIdByTitle).toHaveBeenCalledWith(
      AppointmentStatusTitle.CONFIRMED,
      TX,
    );
    expect(appointmentsRepository.createAppointment).toHaveBeenCalledWith(
      {
        blockId: BLOCK_ID,
        mentorId: MENTOR_ID,
        studentId: STUDENT_ID,
        startAt: createdBlock.startAt,
        endAt: createdBlock.endAt,
        statusId: STATUS_ID,
        orientationTypeId: TOPIC_ID,
        message: payload.message,
        meetingUrl: expect.stringMatching(
          /^https:\/\/meet\.jit\.si\/umssy-[0-9a-f-]{36}$/,
        ),
      },
      TX,
    );
    expect(result).toMatchObject({
      id: APPOINTMENT_ID,
      status: AppointmentStatusTitle.CONFIRMED,
      counterpart: { id: MENTOR_ID, fullName: 'Ana Pérez', role: 'mentor' },
      orientationType: { id: TOPIC_ID, name: 'Orientación profesional' },
    });
  });

  it('crea el historial de la cita con el estado CONFIRMED y quién la creó', async () => {
    await service.create(user, payload);

    expect(
      appointmentsRepository.createAppointmentHistory,
    ).toHaveBeenCalledWith(
      {
        appointmentId: APPOINTMENT_ID,
        previousStatusId: null,
        newStatusId: STATUS_ID,
        changedById: STUDENT_ID,
      },
      TX,
    );
  });

  it('responde 400 cuando el mentor no ofrece el tema', async () => {
    mentorsService.findOne.mockResolvedValue({
      id: MENTOR_ID,
      isAvailable: true,
      orientationTypes: [
        {
          id: '88888888-8888-4888-8888-888888888888',
          name: 'Otro tema',
          description: null,
        },
      ],
    });

    await expect(service.create(user, payload)).rejects.toThrow(
      InvalidOrientationTypeException,
    );
    expect(appointmentsRepository.createAppointment).not.toHaveBeenCalled();
    expect(
      appointmentsRepository.createAppointmentHistory,
    ).not.toHaveBeenCalled();
  });

  it('normaliza la confirmación heredada a CONFIRMED en la respuesta', async () => {
    appointmentsRepository.createAppointment.mockResolvedValue(
      createAppointmentRecord({
        status: { title: AppointmentStatusTitle.LEGACY_CONFIRMED },
      }),
    );

    const result = await service.create(user, payload);

    expect(result.status).toBe(AppointmentStatusTitle.CONFIRMED);
  });

  it('responde que el horario ya no está disponible cuando el bloque no existe', async () => {
    availabilityService.findBlockWithAppointments.mockResolvedValue(null);

    await expect(service.create(user, payload)).rejects.toThrow(
      SlotUnavailableException,
    );
    expect(mentorsService.findOne).not.toHaveBeenCalled();
    expect(blockedDatesService.runOnUnblockedDay).not.toHaveBeenCalled();
  });

  it('responde 400 cuando el bloque ya pasó', async () => {
    availabilityService.findBlockWithAppointments.mockResolvedValue(
      block({ startAt: new Date(Date.now() - 60 * 60 * 1000) }),
    );

    await expect(service.create(user, payload)).rejects.toThrow(
      BlockInPastException,
    );
    expect(mentorsService.findOne).not.toHaveBeenCalled();
  });

  it('responde 403 cuando el mentor intenta reservar su propio bloque', async () => {
    availabilityService.findBlockWithAppointments.mockResolvedValue(
      block({ mentorId: STUDENT_ID }),
    );

    await expect(service.create(user, payload)).rejects.toThrow(
      OwnBlockException,
    );
    expect(mentorsService.findOne).not.toHaveBeenCalled();
  });

  it('responde 409 cuando el bloque ya tiene una cita activa', async () => {
    availabilityService.findBlockWithAppointments.mockResolvedValue(
      block({
        appointments: [{ status: { title: AppointmentStatusTitle.CONFIRMED } }],
      }),
    );

    await expect(service.create(user, payload)).rejects.toThrow(
      BlockAlreadyBookedException,
    );
    expect(mentorsService.findOne).not.toHaveBeenCalled();
    expect(appointmentsRepository.createAppointment).not.toHaveBeenCalled();
  });

  it('propaga el 404 cuando el mentor del bloque no está activo', async () => {
    mentorsService.findOne.mockRejectedValue(new MentorNotFoundException());

    await expect(service.create(user, payload)).rejects.toThrow(
      MentorNotFoundException,
    );
    expect(appointmentsRepository.createAppointment).not.toHaveBeenCalled();
  });

  it('responde 403 cuando el mentor está pausado', async () => {
    mentorsService.findOne.mockResolvedValue({
      id: MENTOR_ID,
      isAvailable: false,
    });

    await expect(service.create(user, payload)).rejects.toThrow(
      MentorUnavailableException,
    );
    expect(appointmentsRepository.createAppointment).not.toHaveBeenCalled();
    expect(
      appointmentsRepository.createAppointmentHistory,
    ).not.toHaveBeenCalled();
  });

  it('responde que el horario ya no está disponible cuando el día está bloqueado', async () => {
    blockedDatesService.runOnUnblockedDay.mockRejectedValue(
      new DayBlockedException(),
    );

    await expect(service.create(user, payload)).rejects.toThrow(
      SlotUnavailableException,
    );
    expect(appointmentsRepository.createAppointment).not.toHaveBeenCalled();
  });

  it('responde 409 cuando el candado del día expira', async () => {
    blockedDatesService.runOnUnblockedDay.mockRejectedValue(
      new DayBusyException(),
    );

    await expect(service.create(user, payload)).rejects.toThrow(
      DayBusyException,
    );
    expect(appointmentsRepository.createAppointment).not.toHaveBeenCalled();
  });

  it('responde 409 sin crear la cita cuando otra reserva gana dentro del candado', async () => {
    availabilityService.findBlockWithAppointments
      .mockResolvedValueOnce(block())
      .mockResolvedValueOnce(
        block({
          appointments: [
            { status: { title: AppointmentStatusTitle.CONFIRMED } },
          ],
        }),
      );

    await expect(service.create(user, payload)).rejects.toThrow(
      BlockAlreadyBookedException,
    );
    expect(appointmentsRepository.createAppointment).not.toHaveBeenCalled();
  });

  it('responde que el horario ya no está disponible cuando el bloque desaparece dentro del candado', async () => {
    availabilityService.findBlockWithAppointments
      .mockResolvedValueOnce(block())
      .mockResolvedValueOnce(null);

    await expect(service.create(user, payload)).rejects.toThrow(
      SlotUnavailableException,
    );
    expect(mentorsService.findOne).not.toHaveBeenCalled();
    expect(appointmentsRepository.createAppointment).not.toHaveBeenCalled();
  });

  it('consulta la disponibilidad del mentor dentro del candado, después de releer el bloque', async () => {
    let insideTransaction = false;
    blockedDatesService.runOnUnblockedDay.mockImplementation(
      async (
        _mentorId: string,
        _startAt: Date,
        work: (tx: unknown) => Promise<unknown>,
      ) => {
        insideTransaction = true;
        try {
          return await work(TX);
        } finally {
          insideTransaction = false;
        }
      },
    );
    mentorsService.findOne.mockImplementation(async () => {
      expect(insideTransaction).toBe(true);
      return {
        id: MENTOR_ID,
        isAvailable: true,
        orientationTypes: [{ id: TOPIC_ID, name: 'Orientación profesional' }],
      };
    });

    await service.create(user, payload);

    expect(mentorsService.findOne).toHaveBeenCalledExactlyOnceWith(MENTOR_ID);
    expect(mentorsService.findOne.mock.invocationCallOrder[0]).toBeGreaterThan(
      availabilityService.findBlockWithAppointments.mock.invocationCallOrder[1],
    );
  });

  it('usa el estado del mentor al confirmar aunque estuviera disponible al abrir el formulario', async () => {
    mentorsService.findOne.mockResolvedValueOnce({
      id: MENTOR_ID,
      isAvailable: false,
      orientationTypes: [{ id: TOPIC_ID, name: 'Orientación profesional' }],
    });

    await expect(service.create(user, payload)).rejects.toMatchObject({
      statusCode: 403,
      message: 'El mentor no está disponible para recibir citas',
    });
    expect(appointmentsRepository.findStatusIdByTitle).not.toHaveBeenCalled();
    expect(appointmentsRepository.createAppointment).not.toHaveBeenCalled();
  });

  it('no crea la cita cuando falla el servicio de mentores', async () => {
    const failure = new Error('Database unavailable');
    mentorsService.findOne.mockRejectedValue(failure);

    await expect(service.create(user, payload)).rejects.toBe(failure);
    expect(appointmentsRepository.createAppointment).not.toHaveBeenCalled();
    expect(
      appointmentsRepository.createAppointmentHistory,
    ).not.toHaveBeenCalled();
  });

  it('permite reservar a un mentor en pausa con otro mentor disponible', async () => {
    const pausedMentor = {
      id: STUDENT_ID,
      email: 'mentor.pausado@test.com',
      roles: ['mentor'],
    };

    await expect(service.create(pausedMentor, payload)).resolves.toMatchObject({
      id: APPOINTMENT_ID,
    });
    expect(mentorsService.findOne).toHaveBeenCalledExactlyOnceWith(MENTOR_ID);
  });

  it('propaga errores que no son de día bloqueado sin cambiarlos', async () => {
    const failure = new Error('Transaction aborted');
    blockedDatesService.runOnUnblockedDay.mockRejectedValue(failure);

    await expect(service.create(user, payload)).rejects.toBe(failure);
  });

  it('usa el texto del HU para el horario que ya no está disponible', () => {
    const error = new SlotUnavailableException();

    expect(error.message).toBe('Este horario ya no está disponible');
    expect(error.statusCode).toBe(409);
  });

  it('toma el candado de quien reserva y del mentor antes de releer el bloque', async () => {
    await service.create(user, payload);

    expect(appointmentsRepository.lockParticipants).toHaveBeenCalledWith(
      [STUDENT_ID, MENTOR_ID],
      TX,
    );
    expect(
      appointmentsRepository.lockParticipants.mock.invocationCallOrder[0],
    ).toBeLessThan(
      availabilityService.findBlockWithAppointments.mock.invocationCallOrder[1],
    );
  });

  it('revisa los cruces de quien reserva con el horario del bloque', async () => {
    const createdBlock = block();
    availabilityService.findBlockWithAppointments
      .mockResolvedValueOnce(createdBlock)
      .mockResolvedValueOnce(createdBlock);

    await service.create(user, payload);

    expect(
      appointmentsRepository.hasOverlappingAppointment,
    ).toHaveBeenCalledWith(
      STUDENT_ID,
      createdBlock.startAt,
      createdBlock.endAt,
      TX,
    );
  });

  it('responde 409 sin crear la cita cuando quien reserva ya tiene una cita que se cruza', async () => {
    appointmentsRepository.hasOverlappingAppointment.mockResolvedValue(true);

    await expect(service.create(user, payload)).rejects.toThrow(
      AppointmentOverlapException,
    );
    expect(appointmentsRepository.createAppointment).not.toHaveBeenCalled();
    expect(
      appointmentsRepository.createAppointmentHistory,
    ).not.toHaveBeenCalled();
  });

  it('revisa las reservas de quien reserva en el día del bloque, en hora de Bolivia', async () => {
    const createdBlock = block({
      startAt: new Date('2026-11-17T02:30:00.000Z'),
      endAt: new Date('2026-11-17T04:00:00.000Z'),
    });
    vi.useFakeTimers({
      toFake: ['Date'],
      now: new Date('2026-11-16T12:00:00.000Z'),
    });
    availabilityService.findBlockWithAppointments.mockResolvedValue(
      createdBlock,
    );

    try {
      await service.create(user, payload);
    } finally {
      vi.useRealTimers();
    }

    expect(appointmentsRepository.hasReservationOnDay).toHaveBeenCalledWith(
      STUDENT_ID,
      {
        start: new Date('2026-11-16T04:00:00.000Z'),
        end: new Date('2026-11-17T04:00:00.000Z'),
      },
      TX,
    );
  });

  it('responde 409 sin crear la cita cuando quien reserva ya tiene una cita ese día', async () => {
    appointmentsRepository.hasReservationOnDay.mockResolvedValue(true);

    await expect(service.create(user, payload)).rejects.toThrow(
      DailyAppointmentLimitException,
    );
    expect(appointmentsRepository.createAppointment).not.toHaveBeenCalled();
    expect(
      appointmentsRepository.createAppointmentHistory,
    ).not.toHaveBeenCalled();
  });

  it('informa primero el cruce de horario antes que el límite diario', async () => {
    appointmentsRepository.hasOverlappingAppointment.mockResolvedValue(true);
    appointmentsRepository.hasReservationOnDay.mockResolvedValue(true);

    await expect(service.create(user, payload)).rejects.toThrow(
      AppointmentOverlapException,
    );
    expect(appointmentsRepository.hasReservationOnDay).not.toHaveBeenCalled();
  });

  it('usa el texto del HU para el límite de una cita por día', () => {
    const error = new DailyAppointmentLimitException();

    expect(error.message).toBe(
      'Ya tienes una cita reservada ese día. Elige otro día.',
    );
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('DAILY_APPOINTMENT_LIMIT');
  });

  it('usa el texto del HU para la cita que se cruza', () => {
    const error = new AppointmentOverlapException();

    expect(error.message).toBe(
      'Ya tienes una cita en ese horario. Elige otro horario.',
    );
    expect(error.statusCode).toBe(409);
  });

  it('usa el texto del HU para la reserva ya tomada', () => {
    expect(new BlockAlreadyBookedException().message).toBe(
      'Este horario ya fue reservado',
    );
  });

  it('guarda una sala distinta de videollamada en cada cita confirmada', async () => {
    await service.create(user, payload);
    await service.create(user, payload);

    const [first, second] =
      appointmentsRepository.createAppointment.mock.calls.map(
        ([data]) => (data as { meetingUrl: string }).meetingUrl,
      );
    expect(first).not.toBe(second);
  });

  it('no devuelve el enlace en la respuesta de la reserva', async () => {
    const result = await service.create(user, payload);

    expect(result).not.toHaveProperty('meetingUrl');
  });
});
