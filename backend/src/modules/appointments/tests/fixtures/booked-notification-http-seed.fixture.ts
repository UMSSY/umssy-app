import type { NotificationMailContent } from '../../../notifications/types/notification-mail-content.type.js';
import type { NotificationMailRenderer } from '../../../notifications/types/notification-mail-renderer.type.js';
import { NotificationType } from '../../../notifications/types/notification-type.enum.js';
import { AppointmentNotificationChannel } from '../../enums/appointment-notification-channel.enum.js';
import { AppointmentNotificationEvent } from '../../enums/appointment-notification-event.enum.js';
import { AppointmentNotificationStatus } from '../../enums/appointment-notification-status.enum.js';
import { InMemoryOverlapSeed } from './overlap-http-seed.fixture.js';

const channelResult = (status: 'sent' | 'failed') => ({
  status,
  deliveries: [],
});

export type InMemoryNotificationPreference = {
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
};

export type InMemoryAppointmentNotificationRow = {
  id: string;
  appointmentId: string;
  recipientId: string;
  eventId: string;
  channelTitle: AppointmentNotificationChannel;
  status: AppointmentNotificationStatus;
  attempts: number;
  lastError: string | null;
  sentAt: Date | null;
};

export type InMemoryInAppNotification = {
  id: string;
  recipientId: string;
  actorId?: string;
  typeId: string;
  title: string;
  body: string;
  link: string;
  groupKey?: string;
};

export type EmailDispatch = {
  userIds: string[];
  title: string;
  body: string;
  actionUrl: string;
  content?: NotificationMailContent;
};

export type PushDispatch = {
  userIds: string[];
  title: string;
  body: string;
  actionUrl: string;
  groupKey?: string;
  notificationIds?: ReadonlyMap<string, string>;
};

export type FailureSnapshot = {
  rowId: string;
  recipientId: string;
  channel: AppointmentNotificationChannel;
  attempts: number;
  failedStatusId?: string;
  statusBefore: AppointmentNotificationStatus;
};

type PendingInput = {
  appointmentId: string;
  recipientId: string;
  eventId: string;
  channelId: string;
  statusId: string;
};

type CreateInAppInput = {
  recipientId: string;
  actorId?: string;
  typeId: string;
  title: string;
  body: string;
  link: string;
  groupKey?: string;
};

const DEFAULT_PREFERENCE: InMemoryNotificationPreference = {
  pushEnabled: false,
  emailEnabled: true,
  inAppEnabled: true,
};

/**
 * Seed en memoria para la integración HTTP del aviso de reserva.
 * Reutiliza el seed de citas y simula los repositorios y canales de envío.
 */
export class BookedNotificationHttpSeed extends InMemoryOverlapSeed {
  readonly appointmentNotificationRows: InMemoryAppointmentNotificationRow[] =
    [];
  readonly inAppNotifications: InMemoryInAppNotification[] = [];
  readonly gatewayEvents: Array<{
    userId: string;
    event: string;
    payload: unknown;
  }> = [];
  readonly emailDispatches: EmailDispatch[] = [];
  readonly pushDispatches: PushDispatch[] = [];
  readonly failureSnapshots: FailureSnapshot[] = [];

  private readonly preferences = new Map<
    string,
    InMemoryNotificationPreference
  >();
  private emailFailuresRemaining = 0;
  private pushFailuresRemaining = 0;
  private emailAlwaysFails = false;
  private emailThrows = false;
  private sequence = 0;

  setPreference(
    userId: string,
    preference: Partial<InMemoryNotificationPreference>,
  ): void {
    this.preferences.set(userId, { ...DEFAULT_PREFERENCE, ...preference });
  }

  failEmailTimes(times: number): void {
    this.emailFailuresRemaining = times;
  }

  failEmailAlways(): void {
    this.emailAlwaysFails = true;
  }

  throwEmailAlways(): void {
    this.emailThrows = true;
  }

  failPushTimes(times: number): void {
    this.pushFailuresRemaining = times;
  }

  pendingNotificationRows(): InMemoryAppointmentNotificationRow[] {
    return this.appointmentNotificationRows.filter(
      (row) => row.status === AppointmentNotificationStatus.PENDING,
    );
  }

  rowsFor(
    recipientId: string,
    channel?: AppointmentNotificationChannel,
  ): InMemoryAppointmentNotificationRow[] {
    return this.appointmentNotificationRows.filter(
      (row) =>
        row.recipientId === recipientId &&
        (!channel || row.channelTitle === channel),
    );
  }

  inAppFor(recipientId: string): InMemoryInAppNotification[] {
    return this.inAppNotifications.filter(
      (notification) => notification.recipientId === recipientId,
    );
  }

  emailFor(userId: string): EmailDispatch[] {
    return this.emailDispatches.filter((dispatch) =>
      dispatch.userIds.includes(userId),
    );
  }

  pushFor(userId: string): PushDispatch[] {
    return this.pushDispatches.filter((dispatch) =>
      dispatch.userIds.includes(userId),
    );
  }

  failuresFor(channel: AppointmentNotificationChannel): FailureSnapshot[] {
    return this.failureSnapshots.filter(
      (snapshot) => snapshot.channel === channel,
    );
  }

  get appointmentNotificationsRepository() {
    return {
      resolveCatalog: (event: AppointmentNotificationEvent) =>
        Promise.resolve({
          eventId: `event-${event}`,
          statusIds: {
            pending: 'status-PENDING',
            sent: 'status-SENT',
            failed: 'status-FAILED',
          },
          channelIds: {
            [AppointmentNotificationChannel.IN_APP]: 'channel-IN_APP',
            [AppointmentNotificationChannel.EMAIL]: 'channel-EMAIL',
            [AppointmentNotificationChannel.PUSH]: 'channel-PUSH',
          },
        }),
      createPending: (inputs: PendingInput[]) => {
        for (const input of inputs) {
          const channelTitle = input.channelId.replace(
            'channel-',
            '',
          ) as AppointmentNotificationChannel;
          const duplicated = this.appointmentNotificationRows.some(
            (row) =>
              row.appointmentId === input.appointmentId &&
              row.recipientId === input.recipientId &&
              row.eventId === input.eventId &&
              row.channelTitle === channelTitle,
          );
          if (duplicated) {
            continue;
          }
          this.appointmentNotificationRows.push({
            id: `row-${++this.sequence}`,
            appointmentId: input.appointmentId,
            recipientId: input.recipientId,
            eventId: input.eventId,
            channelTitle,
            status: AppointmentNotificationStatus.PENDING,
            attempts: 0,
            lastError: null,
            sentAt: null,
          });
        }
        return Promise.resolve();
      },
      findPendingRows: (appointmentId: string, eventId: string) =>
        Promise.resolve(
          this.appointmentNotificationRows
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
              channel: { title: row.channelTitle },
            })),
        ),
      markSent: (id: string, _statusId: string, sentAt: Date) => {
        const row = this.pendingRow(id);
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
      ) => {
        const row = this.pendingRow(id);
        if (!row) {
          return Promise.resolve();
        }
        this.failureSnapshots.push({
          rowId: row.id,
          recipientId: row.recipientId,
          channel: row.channelTitle,
          attempts,
          failedStatusId,
          statusBefore: row.status,
        });
        row.attempts = attempts;
        row.lastError = error;
        if (failedStatusId) {
          row.status = AppointmentNotificationStatus.FAILED;
        }
        return Promise.resolve();
      },
      discard: (id: string) => {
        const index = this.appointmentNotificationRows.findIndex(
          (row) =>
            row.id === id &&
            row.status === AppointmentNotificationStatus.PENDING,
        );
        if (index >= 0) {
          this.appointmentNotificationRows.splice(index, 1);
        }
        return Promise.resolve();
      },
    };
  }

  get notificationsRepository() {
    return {
      findTypeByCode: (code: string) =>
        Promise.resolve(
          code === NotificationType.APPOINTMENT_BOOKED
            ? {
                id: 'type-APPOINTMENT_BOOKED',
                code,
                sendsPush: true,
                sendsEmail: true,
              }
            : null,
        ),
      createMany: (inputs: CreateInAppInput[]) => {
        const created = inputs.map((input) => {
          const notification: InMemoryInAppNotification = {
            id: `notification-${++this.sequence}`,
            ...input,
          };
          this.inAppNotifications.push(notification);
          return {
            id: notification.id,
            recipientId: notification.recipientId,
          };
        });
        return Promise.resolve(created);
      },
    };
  }

  get preferencesRepository() {
    return {
      findManyByUserIds: (userIds: string[]) =>
        Promise.resolve(
          userIds.map((userId) => ({
            userId,
            ...(this.preferences.get(userId) ?? DEFAULT_PREFERENCE),
          })),
        ),
    };
  }

  get notificationUserLookupRepository() {
    return {
      hasBlockBetween: () => Promise.resolve(false),
      findEmailByUserId: (userId: string) =>
        Promise.resolve(`${userId}@umssy.test`),
    };
  }

  get notificationGateway() {
    return {
      emitToUser: (userId: string, event: string, payload: unknown) => {
        this.gatewayEvents.push({ userId, event, payload });
      },
    };
  }

  get appVisibilityService() {
    return {
      isVisible: () => false,
    };
  }

  get mailDispatcher() {
    return {
      dispatchToUsers: async (
        userIds: string[],
        title: string,
        body: string,
        actionUrl: string,
        renderMail?: NotificationMailRenderer,
      ) => {
        const content = await renderMail?.({ recipientName: '', actionUrl });
        this.emailDispatches.push({
          userIds,
          title,
          body,
          actionUrl,
          content,
        });
        if (this.emailThrows) {
          throw new Error('Correo no disponible');
        }
        if (this.emailAlwaysFails) {
          return channelResult('failed');
        }
        if (this.emailFailuresRemaining > 0) {
          this.emailFailuresRemaining--;
          return channelResult('failed');
        }
        return channelResult('sent');
      },
    };
  }

  get pushDispatcher() {
    return {
      dispatchToUsers: (
        userIds: string[],
        title: string,
        body: string,
        actionUrl: string,
        groupKey?: string,
        notificationIds?: ReadonlyMap<string, string>,
      ) => {
        this.pushDispatches.push({
          userIds,
          title,
          body,
          actionUrl,
          groupKey,
          notificationIds,
        });
        if (this.pushFailuresRemaining > 0) {
          this.pushFailuresRemaining--;
          return Promise.resolve(channelResult('failed'));
        }
        return Promise.resolve(channelResult('sent'));
      },
    };
  }

  private pendingRow(
    id: string,
  ): InMemoryAppointmentNotificationRow | undefined {
    return this.appointmentNotificationRows.find(
      (row) =>
        row.id === id && row.status === AppointmentNotificationStatus.PENDING,
    );
  }
}
