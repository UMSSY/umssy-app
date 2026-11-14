import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import {
  AppointmentNotCancellableException,
  AppointmentNotFoundException,
  AppointmentNotOwnedException,
  CancelReasonRequiredException,
} from '../exceptions/index.js';
import { AppointmentDocumentMapper } from '../mappers/appointment-document.mapper.js';
import { AppointmentMapper } from '../mappers/appointment.mapper.js';
import { AppointmentsService } from '../services/appointments.service.js';
import {
  APPOINTMENT_ID,
  createAppointmentRecord,
  MENTOR_ID,
  NOW,
  OTHER_USER_ID,
  STUDENT_ID,
} from './fixtures/appointment-record.fixture.js';

const STATUS_ID = '77777777-7777-4777-8777-777777777777';
const CANCELLED_STATUS_ID = '99999999-9999-4999-8999-999999999999';
const TX = { kind: 'tx' };
const HOUR = 60 * 60 * 1000;

describe('AppointmentsService.cancel', () => {
  const appointmentsRepository = {
    findById: vi.fn(),
    findStatusIdByTitle: vi.fn(),
    lockParticipants: vi.fn(),
    cancelAppointment: vi.fn(),
    createAppointmentHistory: vi.fn(),
  };
  const transactions = {
    run: vi.fn(
      (operation: (context: { client: unknown }) => Promise<unknown>) =>
        operation({ client: TX }),
    ),
  };
  const student = {
    id: STUDENT_ID,
    email: 'student@test.com',
    roles: ['estudiante'],
  };
  const mentor = {
    id: MENTOR_ID,
    email: 'mentor@test.com',
    roles: ['mentor'],
  };
  let service: AppointmentsService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    appointmentsRepository.findById.mockResolvedValue(createAppointmentRecord());
    appointmentsRepository.findStatusIdByTitle.mockImplementation(
      async (title: AppointmentStatusTitle) =>
        title === AppointmentStatusTitle.CANCELLED
          ? CANCELLED_STATUS_ID
          : STATUS_ID,
    );
    appointmentsRepository.lockParticipants.mockResolvedValue(undefined);
    appointmentsRepository.cancelAppointment.mockResolvedValue(
      createAppointmentRecord({
        status: { title: AppointmentStatusTitle.CANCELLED },
      }),
    );
    appointmentsRepository.createAppointmentHistory.mockResolvedValue(
      undefined,
    );
    service = new AppointmentsService(
      appointmentsRepository as never,
      new AppointmentMapper(new AppointmentDocumentMapper()),
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      transactions as never,
    );
  });

  it('cancela la cita con el motivo y registra el cambio de estado', async () => {
    const result = await service.cancel(student, APPOINTMENT_ID, {
      reason: 'Imprevisto',
    });

    expect(appointmentsRepository.lockParticipants).toHaveBeenCalledWith(
      [STUDENT_ID, MENTOR_ID],
      TX,
    );
    expect(appointmentsRepository.cancelAppointment).toHaveBeenCalledWith(
      APPOINTMENT_ID,
      {
        statusId: CANCELLED_STATUS_ID,
        cancelledById: STUDENT_ID,
        cancelledAt: NOW,
        cancellationReason: 'Imprevisto',
      },
      TX,
    );
    expect(
      appointmentsRepository.findStatusIdByTitle,
    ).toHaveBeenCalledWith(AppointmentStatusTitle.CONFIRMED, TX);
    expect(appointmentsRepository.createAppointmentHistory).toHaveBeenCalledWith(
      {
        appointmentId: APPOINTMENT_ID,
        previousStatusId: STATUS_ID,
        newStatusId: CANCELLED_STATUS_ID,
        changedById: STUDENT_ID,
      },
      TX,
    );
    expect(result).toMatchObject({
      id: APPOINTMENT_ID,
      status: AppointmentStatusTitle.CANCELLED,
      counterpart: { id: MENTOR_ID, fullName: 'Ana Pérez' },
    });
  });

  it('registra al mentor como quien canceló su cita', async () => {
    await service.cancel(mentor, APPOINTMENT_ID, {
      reason: 'No podré asistir',
    });

    expect(appointmentsRepository.cancelAppointment).toHaveBeenCalledWith(
      APPOINTMENT_ID,
      expect.objectContaining({
        cancelledById: MENTOR_ID,
        cancellationReason: 'No podré asistir',
      }),
      TX,
    );
    expect(appointmentsRepository.createAppointmentHistory).toHaveBeenCalledWith(
      expect.objectContaining({ changedById: MENTOR_ID }),
      TX,
    );
  });

  it('responde 404 cuando la cita no existe', async () => {
    appointmentsRepository.findById.mockResolvedValue(null);

    await expect(
      service.cancel(student, APPOINTMENT_ID, {}),
    ).rejects.toThrow(AppointmentNotFoundException);
    expect(transactions.run).not.toHaveBeenCalled();
  });

  it('responde 403 cuando intenta cancelar una cita de otra persona', async () => {
    appointmentsRepository.findById.mockResolvedValue(
      createAppointmentRecord({ studentId: OTHER_USER_ID }),
    );

    await expect(
      service.cancel(student, APPOINTMENT_ID, { reason: 'Imprevisto' }),
    ).rejects.toThrow(AppointmentNotOwnedException);
    expect(transactions.run).not.toHaveBeenCalled();
  });

  it('devuelve la cita cancelada sin generar una segunda cancelación', async () => {
    appointmentsRepository.findById.mockResolvedValue(
      createAppointmentRecord({
        status: { title: AppointmentStatusTitle.CANCELLED },
      }),
    );

    const result = await service.cancel(student, APPOINTMENT_ID, {});

    expect(result.status).toBe(AppointmentStatusTitle.CANCELLED);
    expect(transactions.run).not.toHaveBeenCalled();
    expect(appointmentsRepository.cancelAppointment).not.toHaveBeenCalled();
    expect(
      appointmentsRepository.createAppointmentHistory,
    ).not.toHaveBeenCalled();
  });

  it('no repite la cancelación cuando otro proceso la registra al mismo tiempo', async () => {
    appointmentsRepository.findById
      .mockResolvedValueOnce(
        createAppointmentRecord({
          startAt: new Date(NOW.getTime() + 48 * HOUR),
        }),
      )
      .mockResolvedValueOnce(
        createAppointmentRecord({
          status: { title: AppointmentStatusTitle.CANCELLED },
        }),
      );

    const result = await service.cancel(student, APPOINTMENT_ID, {});

    expect(result.status).toBe(AppointmentStatusTitle.CANCELLED);
    expect(appointmentsRepository.cancelAppointment).not.toHaveBeenCalled();
    expect(
      appointmentsRepository.createAppointmentHistory,
    ).not.toHaveBeenCalled();
  });

  it('responde 409 cuando la cita ya empezó', async () => {
    appointmentsRepository.findById.mockResolvedValue(
      createAppointmentRecord({ startAt: NOW }),
    );

    await expect(
      service.cancel(student, APPOINTMENT_ID, { reason: 'Imprevisto' }),
    ).rejects.toThrow(AppointmentNotCancellableException);
    expect(transactions.run).not.toHaveBeenCalled();
  });

  it('responde 409 cuando la cita ya no está confirmada', async () => {
    appointmentsRepository.findById.mockResolvedValue(
      createAppointmentRecord({
        status: { title: AppointmentStatusTitle.COMPLETED },
      }),
    );

    await expect(
      service.cancel(student, APPOINTMENT_ID, { reason: 'Imprevisto' }),
    ).rejects.toThrow(AppointmentNotCancellableException);
    expect(transactions.run).not.toHaveBeenCalled();
  });

  it('pide el motivo cuando faltan menos de 24 horas', async () => {
    await expect(service.cancel(student, APPOINTMENT_ID, {})).rejects.toThrow(
      CancelReasonRequiredException,
    );
    expect(transactions.run).not.toHaveBeenCalled();
  });

  it('pide el motivo cuando llega vacío y faltan menos de 24 horas', async () => {
    await expect(
      service.cancel(student, APPOINTMENT_ID, { reason: '   ' }),
    ).rejects.toThrow(CancelReasonRequiredException);
    expect(transactions.run).not.toHaveBeenCalled();
  });

  it('permite cancelar sin motivo cuando faltan exactamente 24 horas', async () => {
    appointmentsRepository.findById.mockResolvedValue(
      createAppointmentRecord({
        startAt: new Date(NOW.getTime() + 24 * HOUR),
      }),
    );

    await expect(service.cancel(student, APPOINTMENT_ID, {})).resolves.toMatchObject(
      { status: AppointmentStatusTitle.CANCELLED },
    );
    expect(appointmentsRepository.cancelAppointment).toHaveBeenCalledWith(
      APPOINTMENT_ID,
      expect.objectContaining({ cancellationReason: null }),
      TX,
    );
  });

  it('permite cancelar sin motivo cuando faltan más de 24 horas', async () => {
    appointmentsRepository.findById.mockResolvedValue(
      createAppointmentRecord({
        startAt: new Date(NOW.getTime() + 48 * HOUR),
      }),
    );

    await expect(service.cancel(student, APPOINTMENT_ID, {})).resolves.toMatchObject(
      { status: AppointmentStatusTitle.CANCELLED },
    );
    expect(appointmentsRepository.cancelAppointment).toHaveBeenCalledWith(
      APPOINTMENT_ID,
      expect.objectContaining({ cancellationReason: null }),
      TX,
    );
  });

  it('recorta el motivo antes de guardarlo', async () => {
    appointmentsRepository.findById.mockResolvedValue(
      createAppointmentRecord({
        startAt: new Date(NOW.getTime() + 48 * HOUR),
      }),
    );

    await service.cancel(student, APPOINTMENT_ID, { reason: '  imprevisto  ' });

    expect(appointmentsRepository.cancelAppointment).toHaveBeenCalledWith(
      APPOINTMENT_ID,
      expect.objectContaining({ cancellationReason: 'imprevisto' }),
      TX,
    );
  });
});
