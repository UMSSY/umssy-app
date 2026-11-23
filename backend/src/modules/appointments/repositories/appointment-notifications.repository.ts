import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../prisma/client.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { APPOINTMENT_NOTIFICATION_SELECT } from '../constants/appointment-notification-select.constants.js';
import { AppointmentNotificationChannel } from '../enums/appointment-notification-channel.enum.js';
import { AppointmentNotificationEvent } from '../enums/appointment-notification-event.enum.js';
import { AppointmentNotificationStatus } from '../enums/appointment-notification-status.enum.js';
import type { AppointmentNotificationCatalog } from '../types/appointment-notification-catalog.type.js';
import type { AppointmentNotificationRecord } from '../types/appointment-notification-record.type.js';

@Injectable()
export class AppointmentNotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async resolveCatalog(
    event: AppointmentNotificationEvent,
  ): Promise<AppointmentNotificationCatalog> {
    const [eventRecord, pending, sent, failed, inApp, email, push] =
      await Promise.all([
        this.prisma.appointmentNotificationEvent.findUniqueOrThrow({
          where: { title: event },
          select: { id: true },
        }),
        this.findStatusId(AppointmentNotificationStatus.PENDING),
        this.findStatusId(AppointmentNotificationStatus.SENT),
        this.findStatusId(AppointmentNotificationStatus.FAILED),
        this.findChannelId(AppointmentNotificationChannel.IN_APP),
        this.findChannelId(AppointmentNotificationChannel.EMAIL),
        this.findChannelId(AppointmentNotificationChannel.PUSH),
      ]);

    return {
      eventId: eventRecord.id,
      statusIds: { pending, sent, failed },
      channelIds: {
        IN_APP: inApp,
        EMAIL: email,
        PUSH: push,
      },
    };
  }

  async createPending(
    data: Prisma.AppointmentNotificationCreateManyInput[],
  ): Promise<void> {
    await this.prisma.appointmentNotification.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async findPendingRows(
    appointmentId: string,
    eventId: string,
  ): Promise<AppointmentNotificationRecord[]> {
    return this.prisma.appointmentNotification.findMany({
      where: {
        appointmentId,
        eventId,
        status: { title: AppointmentNotificationStatus.PENDING },
      },
      select: APPOINTMENT_NOTIFICATION_SELECT,
    });
  }

  async markSent(id: string, statusId: string, sentAt: Date): Promise<void> {
    await this.prisma.appointmentNotification.updateMany({
      where: { id, status: { title: AppointmentNotificationStatus.PENDING } },
      data: { statusId, sentAt, lastError: null },
    });
  }

  async recordFailure(
    id: string,
    error: string,
    attempts: number,
    failedStatusId?: string,
  ): Promise<void> {
    await this.prisma.appointmentNotification.updateMany({
      where: { id, status: { title: AppointmentNotificationStatus.PENDING } },
      data: {
        attempts,
        lastError: error,
        ...(failedStatusId ? { statusId: failedStatusId } : {}),
      },
    });
  }

  async discard(id: string): Promise<void> {
    await this.prisma.appointmentNotification.deleteMany({
      where: { id, status: { title: AppointmentNotificationStatus.PENDING } },
    });
  }

  private findStatusId(title: AppointmentNotificationStatus): Promise<string> {
    return this.prisma.appointmentNotificationStatus
      .findUniqueOrThrow({ where: { title }, select: { id: true } })
      .then((status) => status.id);
  }

  private findChannelId(
    title: AppointmentNotificationChannel,
  ): Promise<string> {
    return this.prisma.appointmentNotificationChannel
      .findUniqueOrThrow({ where: { title }, select: { id: true } })
      .then((channel) => channel.id);
  }
}
