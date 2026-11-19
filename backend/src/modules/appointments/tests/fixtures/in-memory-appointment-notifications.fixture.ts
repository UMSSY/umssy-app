import { AppointmentNotificationChannel } from '../../enums/appointment-notification-channel.enum.js';
import type { AppointmentNotificationEvent } from '../../enums/appointment-notification-event.enum.js';
import { AppointmentNotificationStatus } from '../../enums/appointment-notification-status.enum.js';
import type { AppointmentNotificationCatalog } from '../../types/appointment-notification-catalog.type.js';
import type { AppointmentNotificationRecord } from '../../types/appointment-notification-record.type.js';

type PendingInput = {
  appointmentId: string;
  recipientId: string;
  eventId: string;
  channelId: string;
  statusId: string;
};

export type InMemoryAppointmentNotification = {
  id: string;
  appointmentId: string;
  recipientId: string;
  eventId: string;
  channel: AppointmentNotificationChannel;
  status: AppointmentNotificationStatus;
  attempts: number;
  lastError: string | null;
  sentAt: Date | null;
};

const statusIdOf = (status: AppointmentNotificationStatus) =>
  `status-${status}`;
const channelIdOf = (channel: AppointmentNotificationChannel) =>
  `channel-${channel}`;

// Repositorio de avisos de citas en memoria: reproduce la clave única
// (cita, destinatario, evento, canal) y el filtro por estado PENDING.
export class InMemoryAppointmentNotifications {
  readonly rows: InMemoryAppointmentNotification[] = [];
  private sequence = 0;

  readonly repository = {
    resolveCatalog: (
      event: AppointmentNotificationEvent,
    ): Promise<AppointmentNotificationCatalog> =>
      Promise.resolve({
        eventId: `event-${event}`,
        statusIds: {
          pending: statusIdOf(AppointmentNotificationStatus.PENDING),
          sent: statusIdOf(AppointmentNotificationStatus.SENT),
          failed: statusIdOf(AppointmentNotificationStatus.FAILED),
        },
        channelIds: {
          IN_APP: channelIdOf(AppointmentNotificationChannel.IN_APP),
          EMAIL: channelIdOf(AppointmentNotificationChannel.EMAIL),
          PUSH: channelIdOf(AppointmentNotificationChannel.PUSH),
        },
      }),
    createPending: (inputs: PendingInput[]): Promise<void> => {
      for (const input of inputs) {
        const channel = Object.values(AppointmentNotificationChannel).find(
          (value) => channelIdOf(value) === input.channelId,
        );
        if (!channel) {
          throw new Error(`Canal desconocido ${input.channelId}`);
        }
        const duplicated = this.rows.some(
          (row) =>
            row.appointmentId === input.appointmentId &&
            row.recipientId === input.recipientId &&
            row.eventId === input.eventId &&
            row.channel === channel,
        );
        if (!duplicated) {
          this.sequence += 1;
          this.rows.push({
            id: `notification-${this.sequence}`,
            appointmentId: input.appointmentId,
            recipientId: input.recipientId,
            eventId: input.eventId,
            channel,
            status: AppointmentNotificationStatus.PENDING,
            attempts: 0,
            lastError: null,
            sentAt: null,
          });
        }
      }
      return Promise.resolve();
    },
    findPendingRows: (
      appointmentId: string,
      eventId: string,
    ): Promise<AppointmentNotificationRecord[]> =>
      Promise.resolve(
        this.rows
          .filter(
            (row) =>
              row.appointmentId === appointmentId &&
              row.eventId === eventId &&
              row.status === AppointmentNotificationStatus.PENDING,
          )
          .map((row) => ({
            id: row.id,
            appointmentId: row.appointmentId,
            recipientId: row.recipientId,
            attempts: row.attempts,
            channel: { title: row.channel },
          })),
      ),
    markSent: (id: string, _statusId: string, sentAt: Date): Promise<void> => {
      const row = this.pending(id);
      if (row) {
        row.status = AppointmentNotificationStatus.SENT;
        row.sentAt = sentAt;
        row.lastError = null;
      }
      return Promise.resolve();
    },
    recordFailure: (
      id: string,
      error: string,
      attempts: number,
      failedStatusId?: string,
    ): Promise<void> => {
      const row = this.pending(id);
      if (row) {
        row.attempts = attempts;
        row.lastError = error;
        if (failedStatusId) {
          row.status = AppointmentNotificationStatus.FAILED;
        }
      }
      return Promise.resolve();
    },
    discard: (id: string): Promise<void> => {
      const index = this.rows.findIndex(
        (row) =>
          row.id === id && row.status === AppointmentNotificationStatus.PENDING,
      );
      if (index !== -1) {
        this.rows.splice(index, 1);
      }
      return Promise.resolve();
    },
  };

  rowsOf(appointmentId: string): InMemoryAppointmentNotification[] {
    return this.rows.filter((row) => row.appointmentId === appointmentId);
  }

  private pending(id: string): InMemoryAppointmentNotification | undefined {
    return this.rows.find(
      (row) =>
        row.id === id && row.status === AppointmentNotificationStatus.PENDING,
    );
  }
}
