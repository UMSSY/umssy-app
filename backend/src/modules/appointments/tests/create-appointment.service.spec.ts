import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import {
  BlockNotFoundException,
  DayBlockedException,
  DayBusyException,
} from '../../availability/exceptions/index.js';
import { MentorNotFoundException } from '../../mentors/exceptions/mentor-not-found.exception.js';
import {
  BlockAlreadyBookedException,
  BlockInPastException,
  InvalidOrientationTypeException,
  MentorUnavailableException,
  OwnBlockException,
} from '../exceptions/index.js';
import { AppointmentMapper } from '../mappers/appointment.mapper.js';
import type { CreateAppointmentDto } from '../requests/create-appointment.request.js';
import { AppointmentsService } from '../services/appointments.service.js';
import {
  APPOINTMENT_ID,
  createAppointmentRecord,
  MENTOR_ID,
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
    availabilityService.findBlockWithAppointments.mockResolvedValue(block());
    mentorsService.findOne.mockResolvedValue({
      id: MENTOR_ID,
      isAvailable: true,
      orientationTypes: [
        { id: TOPIC_ID, name: 'Orientación profesional', description: null },
      ],
    });
    blockedDatesService.runOnUnblockedDay.mockImplementation(
      async (_mentorId: string, _startAt: Date, work: (tx: unknown) => Promise<unknown>) =>
        work(TX),
    );
    appointmentsRepository.findStatusIdByTitle.mockResolvedValue(STATUS_ID);
    appointmentsRepository.createAppointment.mockResolvedValue(
      createAppointmentRecord(),
    );
    service = new AppointmentsService(
      appointmentsRepository as never,
      new AppointmentMapper(),
      availabilityService as never,
      blockedDatesService as never,
      mentorsService as never,
    );
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
    expect(availabilityService.findBlockWithAppointments).toHaveBeenLastCalledWith(BLOCK_ID, TX);
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
      },
      TX,
    );
    expect(result).toMatchObject({
      id: APPOINTMENT_ID,
      status: AppointmentStatusTitle.CONFIRMED,
      counterpart: { id: MENTOR_ID, fullName: 'Ana Pérez' },
      orientationType: { id: TOPIC_ID, name: 'Orientación profesional' },
    });
  });

  it('crea el historial de la cita con el estado CONFIRMED y quién la creó', async () => {
    await service.create(user, payload);

    expect(appointmentsRepository.createAppointmentHistory).toHaveBeenCalledWith(
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
    expect(blockedDatesService.runOnUnblockedDay).not.toHaveBeenCalled();
    expect(appointmentsRepository.createAppointment).not.toHaveBeenCalled();
    expect(appointmentsRepository.createAppointmentHistory).not.toHaveBeenCalled();
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

  it('responde 404 cuando el bloque no existe', async () => {
    availabilityService.findBlockWithAppointments.mockResolvedValue(null);

    await expect(service.create(user, payload)).rejects.toThrow(
      BlockNotFoundException,
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

    await expect(service.create(user, payload)).rejects.toThrow(OwnBlockException);
    expect(mentorsService.findOne).not.toHaveBeenCalled();
  });

  it('responde 409 cuando el bloque ya tiene una cita activa', async () => {
    availabilityService.findBlockWithAppointments.mockResolvedValue(
      block({
        appointments: [
          { status: { title: AppointmentStatusTitle.CONFIRMED } },
        ],
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
    expect(blockedDatesService.runOnUnblockedDay).not.toHaveBeenCalled();
  });

  it('responde 403 cuando el mentor está pausado', async () => {
    mentorsService.findOne.mockResolvedValue({
      id: MENTOR_ID,
      isAvailable: false,
    });

    await expect(service.create(user, payload)).rejects.toThrow(
      MentorUnavailableException,
    );
    expect(blockedDatesService.runOnUnblockedDay).not.toHaveBeenCalled();
    expect(appointmentsRepository.createAppointment).not.toHaveBeenCalled();
  });

  it('responde 409 cuando el día está bloqueado y no crea la cita', async () => {
    blockedDatesService.runOnUnblockedDay.mockRejectedValue(
      new DayBlockedException(),
    );

    await expect(service.create(user, payload)).rejects.toThrow(DayBlockedException);
    expect(appointmentsRepository.createAppointment).not.toHaveBeenCalled();
  });

  it('responde 409 cuando el candado del día expira', async () => {
    blockedDatesService.runOnUnblockedDay.mockRejectedValue(new DayBusyException());

    await expect(service.create(user, payload)).rejects.toThrow(DayBusyException);
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

  it('responde 404 cuando el bloque desaparece dentro del candado', async () => {
    availabilityService.findBlockWithAppointments
      .mockResolvedValueOnce(block())
      .mockResolvedValueOnce(null);

    await expect(service.create(user, payload)).rejects.toThrow(
      BlockNotFoundException,
    );
    expect(appointmentsRepository.createAppointment).not.toHaveBeenCalled();
  });

  it('usa el texto del HU para la reserva ya tomada', () => {
    expect(new BlockAlreadyBookedException().message).toBe(
      'Este horario ya fue reservado',
    );
  });
});
