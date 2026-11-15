import { Injectable, Logger } from '@nestjs/common';
import { toBoliviaTime } from '../../../common/utils/date-time.js';
import { NotificationsService } from '../../notifications/services/notifications.service.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import type { NotifyChannel } from '../../notifications/types/notify-channel.type.js';
import type { NotifyResult } from '../../notifications/types/notify-result.type.js';
import {
  APPOINTMENT_NOTIFICATION_ACTION_URL,
  APPOINTMENT_NOTIFICATION_CHANNELS,
  APPOINTMENT_NOTIFICATION_GROUP_PREFIX,
  APPOINTMENT_NOTIFICATION_MAX_ATTEMPTS,
} from '../constants/appointment-notification.constants.js';
import { AppointmentNotificationChannel } from '../enums/appointment-notification-channel.enum.js';
import { AppointmentNotificationEvent } from '../enums/appointment-notification-event.enum.js';
import { AppointmentNotificationsRepository } from '../repositories/appointment-notifications.repository.js';
import type { AppointmentNotificationCatalog } from '../types/appointment-notification-catalog.type.js';
import type { AppointmentNotificationDispatch } from '../types/appointment-notification-dispatch.type.js';
import type { AppointmentNotificationRecord } from '../types/appointment-notification-record.type.js';
import type { AppointmentRecord } from '../types/appointment-record.types.js';

type RowOutcome = 'sent' | 'failed' | 'omit';

@Injectable()
export class AppointmentNotificationsService {
  private readonly logger = new Logger(AppointmentNotificationsService.name);

  constructor(
    private readonly repository: AppointmentNotificationsRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async notifyBooked(appointment: AppointmentRecord): Promise<void> {
    const { date, time } = toBoliviaTime(appointment.startAt);

    await this.dispatch({
      appointment,
      event: AppointmentNotificationEvent.BOOKED,
      recipientIds: [appointment.mentorId, appointment.studentId],
      buildRequest: (recipientId, channels, groupKey) => ({
        recipientIds: [recipientId],
        type: NotificationType.APPOINTMENT_BOOKED,
        payload: {
          counterpartName: this.counterpartName(appointment, recipientId),
          date,
          time,
          topic: appointment.orientationType?.name ?? '',
        },
        actionUrl: APPOINTMENT_NOTIFICATION_ACTION_URL,
        groupKey,
        channels,
      }),
    });
  }

  async notifyCancelled(
    appointment: AppointmentRecord,
    actorId: string,
  ): Promise<void> {
    const recipientId =
      appointment.mentorId === actorId
        ? appointment.studentId
        : appointment.mentorId;
    const canceller = this.participantOf(appointment, actorId);
    const reason = appointment.cancellationReason;
    const { date, time } = toBoliviaTime(appointment.startAt);

    await this.dispatch({
      appointment,
      event: AppointmentNotificationEvent.CANCELLED,
      recipientIds: [recipientId],
      buildRequest: (recipientIdOfRequest, channels, groupKey) => ({
        recipientIds: [recipientIdOfRequest],
        type: NotificationType.APPOINTMENT_CANCELLED,
        payload: {
          counterpartName: this.fullName(canceller),
          cancelledByName: this.fullName(canceller),
          date,
          time,
          ...(reason ? { reason } : {}),
        },
        actionUrl: APPOINTMENT_NOTIFICATION_ACTION_URL,
        groupKey,
        actorId,
        channels,
      }),
    });
  }

  private async dispatch(
    params: AppointmentNotificationDispatch,
  ): Promise<void> {
    try {
      const { appointment, event, recipientIds, buildRequest } = params;
      const catalog = await this.repository.resolveCatalog(event);
      const groupKey = `${APPOINTMENT_NOTIFICATION_GROUP_PREFIX}:${event}:${appointment.id}`;

      await this.repository.createPending(
        recipientIds.flatMap((recipientId) =>
          APPOINTMENT_NOTIFICATION_CHANNELS.map((channel) => ({
            appointmentId: appointment.id,
            recipientId,
            eventId: catalog.eventId,
            channelId: catalog.channelIds[channel],
            statusId: catalog.statusIds.pending,
          })),
        ),
      );

      for (
        let attempt = 1;
        attempt <= APPOINTMENT_NOTIFICATION_MAX_ATTEMPTS;
        attempt++
      ) {
        const pending = await this.repository.findPendingRows(
          appointment.id,
          catalog.eventId,
        );
        if (pending.length === 0) {
          return;
        }

        const byRecipient = new Map<string, AppointmentNotificationRecord[]>();
        for (const row of pending) {
          const rows = byRecipient.get(row.recipientId);
          if (rows) {
            rows.push(row);
          } else {
            byRecipient.set(row.recipientId, [row]);
          }
        }

        for (const [recipientId, rows] of byRecipient) {
          const channels = rows.map(
            (row) => row.channel.title as NotifyChannel,
          );
          try {
            const result = await this.notificationsService.notify(
              buildRequest(recipientId, channels, groupKey),
            );
            for (const row of rows) {
              await this.settleRow(row, result, catalog);
            }
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            for (const row of rows) {
              await this.failRow(row, message, catalog);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('No se pudo procesar el aviso de la cita', error);
    }
  }

  private async settleRow(
    row: AppointmentNotificationRecord,
    result: NotifyResult,
    catalog: AppointmentNotificationCatalog,
  ): Promise<void> {
    const outcome = this.classify(row, result);
    if (outcome === 'sent') {
      await this.repository.markSent(
        row.id,
        catalog.statusIds.sent,
        new Date(),
      );
      return;
    }
    if (outcome === 'omit') {
      await this.repository.discard(row.id);
      return;
    }
    await this.failRow(
      row,
      `Falló el envío por ${row.channel.title}`,
      catalog,
    );
  }

  private classify(
    row: AppointmentNotificationRecord,
    result: NotifyResult,
  ): RowOutcome {
    if (row.channel.title === AppointmentNotificationChannel.IN_APP) {
      return result.inAppCount > 0 ? 'sent' : 'omit';
    }
    const status =
      row.channel.title === AppointmentNotificationChannel.PUSH
        ? result.pushStatus
        : result.emailStatus;
    if (status === 'sent' || status === 'partial') {
      return 'sent';
    }
    return status === 'failed' ? 'failed' : 'omit';
  }

  private async failRow(
    row: AppointmentNotificationRecord,
    error: string,
    catalog: AppointmentNotificationCatalog,
  ): Promise<void> {
    const attempts = row.attempts + 1;
    await this.repository.recordFailure(
      row.id,
      error,
      attempts,
      attempts >= APPOINTMENT_NOTIFICATION_MAX_ATTEMPTS
        ? catalog.statusIds.failed
        : undefined,
    );
  }

  private counterpartName(
    appointment: AppointmentRecord,
    recipientId: string,
  ): string {
    const counterpart =
      recipientId === appointment.mentorId
        ? appointment.student
        : appointment.mentor;
    return this.fullName(counterpart);
  }

  private participantOf(appointment: AppointmentRecord, userId: string) {
    return appointment.mentorId === userId
      ? appointment.mentor
      : appointment.student;
  }

  private fullName(user: { firstName: string; lastName: string }): string {
    return `${user.firstName} ${user.lastName}`.trim();
  }
}
