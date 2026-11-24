import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { APPOINTMENT_NOTIFICATION_SELECT } from '../constants/appointment-notification-select.constants.js';
import { AppointmentNotificationEvent } from '../enums/appointment-notification-event.enum.js';
import { AppointmentNotificationStatus } from '../enums/appointment-notification-status.enum.js';
import { AppointmentNotificationsRepository } from '../repositories/appointment-notifications.repository.js';

describe('AppointmentNotificationsRepository', () => {
  const findEvent = vi.fn();
  const findStatus = vi.fn();
  const findChannel = vi.fn();
  const createMany = vi.fn();
  const findMany = vi.fn();
  const updateMany = vi.fn();
  const deleteMany = vi.fn();
  let repository: AppointmentNotificationsRepository;

  beforeEach(() => {
    vi.resetAllMocks();
    repository = new AppointmentNotificationsRepository({
      appointmentNotificationEvent: { findUniqueOrThrow: findEvent },
      appointmentNotificationStatus: { findUniqueOrThrow: findStatus },
      appointmentNotificationChannel: { findUniqueOrThrow: findChannel },
      appointmentNotification: { createMany, findMany, updateMany, deleteMany },
    } as unknown as PrismaService);
  });

  it('resuelve el catálogo del evento con los ids de estados y canales', async () => {
    findEvent.mockResolvedValue({ id: 'event-1' });
    findStatus.mockImplementation(({ where }: { where: { title: string } }) =>
      Promise.resolve({ id: `status-${where.title}` }),
    );
    findChannel.mockImplementation(({ where }: { where: { title: string } }) =>
      Promise.resolve({ id: `channel-${where.title}` }),
    );

    await expect(
      repository.resolveCatalog(AppointmentNotificationEvent.BOOKED),
    ).resolves.toEqual({
      eventId: 'event-1',
      statusIds: {
        pending: 'status-PENDING',
        sent: 'status-SENT',
        failed: 'status-FAILED',
      },
      channelIds: {
        IN_APP: 'channel-IN_APP',
        EMAIL: 'channel-EMAIL',
        PUSH: 'channel-PUSH',
      },
    });
    expect(findEvent).toHaveBeenCalledExactlyOnceWith({
      where: { title: AppointmentNotificationEvent.BOOKED },
      select: { id: true },
    });
  });

  it('registra los avisos pendientes sin duplicar por la clave única', async () => {
    const data = [
      {
        appointmentId: 'appointment-1',
        recipientId: 'user-1',
        eventId: 'event-1',
        channelId: 'channel-EMAIL',
        statusId: 'status-PENDING',
      },
    ];

    await repository.createPending(data);

    expect(createMany).toHaveBeenCalledExactlyOnceWith({
      data,
      skipDuplicates: true,
    });
  });

  it('lee solo los avisos pendientes de la cita y el evento', async () => {
    const rows = [
      {
        id: 'row-1',
        appointmentId: 'appointment-1',
        recipientId: 'user-1',
        attempts: 0,
        channel: { title: 'EMAIL' },
      },
    ];
    findMany.mockResolvedValue(rows);

    await expect(
      repository.findPendingRows('appointment-1', 'event-1'),
    ).resolves.toEqual(rows);
    expect(findMany).toHaveBeenCalledExactlyOnceWith({
      where: {
        appointmentId: 'appointment-1',
        eventId: 'event-1',
        status: { title: AppointmentNotificationStatus.PENDING },
      },
      select: APPOINTMENT_NOTIFICATION_SELECT,
    });
  });

  it('marca entregado solo si el aviso sigue pendiente', async () => {
    const sentAt = new Date('2026-10-23T12:00:00.000Z');

    await repository.markSent('row-1', 'status-SENT', sentAt);

    expect(updateMany).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: 'row-1',
        status: { title: AppointmentNotificationStatus.PENDING },
      },
      data: { statusId: 'status-SENT', sentAt, lastError: null },
    });
  });

  it('suma el intento sin cambiar el estado mientras queden reintentos', async () => {
    await repository.recordFailure('row-1', 'SMTP caído', 1);

    expect(updateMany).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: 'row-1',
        status: { title: AppointmentNotificationStatus.PENDING },
      },
      data: { attempts: 1, lastError: 'SMTP caído' },
    });
  });

  it('deja el aviso fallido al agotar los intentos', async () => {
    await repository.recordFailure('row-1', 'SMTP caído', 3, 'status-FAILED');

    expect(updateMany).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: 'row-1',
        status: { title: AppointmentNotificationStatus.PENDING },
      },
      data: { attempts: 3, lastError: 'SMTP caído', statusId: 'status-FAILED' },
    });
  });

  it('descarta el aviso de un canal que la plataforma omite', async () => {
    await repository.discard('row-1');

    expect(deleteMany).toHaveBeenCalledExactlyOnceWith({
      where: {
        id: 'row-1',
        status: { title: AppointmentNotificationStatus.PENDING },
      },
    });
  });
});
