import { describe, expect, it, vi } from 'vitest';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import { APPOINTMENT_SELECT } from '../constants/appointment-select.constants.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';

const STATUS_ID = '77777777-7777-4777-8777-777777777777';
const APPOINTMENT_ID = '44444444-4444-4444-8444-444444444444';

const DATA = {
  blockId: '55555555-5555-4555-8555-555555555555',
  mentorId: '11111111-1111-4111-8111-111111111111',
  studentId: '22222222-2222-4222-8222-222222222222',
  startAt: new Date('2026-10-23T14:00:00.000Z'),
  endAt: new Date('2026-10-23T14:30:00.000Z'),
  statusId: STATUS_ID,
  orientationTypeId: '66666666-6666-4666-8666-666666666666',
  message: 'Hola',
};

describe('AppointmentsRepository', () => {
  it('consulta el id del estado por su título en prisma', async () => {
    const prisma = {
      appointmentStatus: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: STATUS_ID }),
      },
    };
    const repository = new AppointmentsRepository(prisma as never);

    await expect(
      repository.findStatusIdByTitle(AppointmentStatusTitle.CONFIRMED),
    ).resolves.toBe(STATUS_ID);

    expect(prisma.appointmentStatus.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { title: AppointmentStatusTitle.CONFIRMED },
      select: { id: true },
    });
  });

  it('consulta el id del estado en la transacción indicada', async () => {
    const tx = {
      appointmentStatus: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({ id: STATUS_ID }),
      },
    };
    const repository = new AppointmentsRepository({} as never);

    await expect(
      repository.findStatusIdByTitle(
        AppointmentStatusTitle.CONFIRMED,
        tx as never,
      ),
    ).resolves.toBe(STATUS_ID);

    expect(tx.appointmentStatus.findUniqueOrThrow).toHaveBeenCalled();
  });

  it('crea la cita con la selección de respuesta en la transacción indicada', async () => {
    const record = { id: APPOINTMENT_ID };
    const tx = {
      appointment: { create: vi.fn().mockResolvedValue(record) },
    };
    const repository = new AppointmentsRepository({} as never);

    await expect(repository.createAppointment(DATA, tx as never)).resolves.toBe(
      record,
    );

    expect(tx.appointment.create).toHaveBeenCalledWith({
      data: DATA,
      select: APPOINTMENT_SELECT,
    });
  });

  it('crea la cita en prisma cuando no recibe una transacción', async () => {
    const prisma = { appointment: { create: vi.fn() } };
    const repository = new AppointmentsRepository(prisma as never);

    await repository.createAppointment(DATA);

    expect(prisma.appointment.create).toHaveBeenCalledWith({
      data: DATA,
      select: APPOINTMENT_SELECT,
    });
  });

  it('crea el historial de la cita en la transacción indicada', async () => {
    const tx = { appointmentHistory: { create: vi.fn() } };
    const repository = new AppointmentsRepository({} as never);
    const historyData = {
      appointmentId: APPOINTMENT_ID,
      previousStatusId: null,
      newStatusId: STATUS_ID,
      changedById: '22222222-2222-4222-8222-222222222222',
    };

    await repository.createAppointmentHistory(historyData, tx as never);

    expect(tx.appointmentHistory.create).toHaveBeenCalledWith({
      data: historyData,
    });
  });

  it('crea el historial en prisma cuando no recibe una transacción', async () => {
    const prisma = { appointmentHistory: { create: vi.fn() } };
    const repository = new AppointmentsRepository(prisma as never);
    const historyData = {
      appointmentId: APPOINTMENT_ID,
      previousStatusId: null,
      newStatusId: STATUS_ID,
      changedById: '22222222-2222-4222-8222-222222222222',
    };

    await repository.createAppointmentHistory(historyData);

    expect(prisma.appointmentHistory.create).toHaveBeenCalledWith({
      data: historyData,
    });
  });

  it('toma un candado por participante, sin repetir y en orden estable', async () => {
    const tx = { $executeRaw: vi.fn() };
    const repository = new AppointmentsRepository({} as never);

    await repository.lockParticipants(
      [DATA.studentId, DATA.mentorId, DATA.studentId],
      tx as never,
    );

    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
    expect(tx.$executeRaw.mock.calls.map((call) => call[1])).toEqual([
      `appointment-participant:${DATA.mentorId}`,
      `appointment-participant:${DATA.studentId}`,
    ]);
  });

  it('busca citas activas de la persona que empiezan antes del fin y terminan después del inicio', async () => {
    const tx = { appointment: { count: vi.fn().mockResolvedValue(1) } };
    const repository = new AppointmentsRepository({} as never);

    await expect(
      repository.hasOverlappingAppointment(
        DATA.studentId,
        DATA.startAt,
        DATA.endAt,
        tx as never,
      ),
    ).resolves.toBe(true);

    expect(tx.appointment.count).toHaveBeenCalledWith({
      where: {
        OR: [{ mentorId: DATA.studentId }, { studentId: DATA.studentId }],
        startAt: { lt: DATA.endAt },
        endAt: { gt: DATA.startAt },
        status: {
          title: {
            in: [
              AppointmentStatusTitle.CONFIRMED,
              AppointmentStatusTitle.LEGACY_CONFIRMED,
            ],
          },
        },
      },
    });
  });

  it('responde que no hay cruce cuando no encuentra citas activas', async () => {
    const prisma = { appointment: { count: vi.fn().mockResolvedValue(0) } };
    const repository = new AppointmentsRepository(prisma as never);

    await expect(
      repository.hasOverlappingAppointment(
        DATA.studentId,
        DATA.startAt,
        DATA.endAt,
      ),
    ).resolves.toBe(false);
  });
});
