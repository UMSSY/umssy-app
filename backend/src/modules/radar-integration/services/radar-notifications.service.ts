import { RadarPublicationNotFoundException } from '../exceptions/radar-publication-not-found.exception.js';
import { RadarNotificationNotFoundException } from '../exceptions/radar-notification-not-found.exception.js';
import { NotificationsInboxService } from '../../notifications/services/notifications-inbox.service.js';
import { Injectable } from '@nestjs/common';
import { RadarNotificationsRepository } from '../repositories/radar-notifications.repository.js';
import { RadarPublicationMapper } from '../mappers/radar-publication.mapper.js';

@Injectable()
export class RadarNotificationsService {
  constructor(
    private readonly repository: RadarNotificationsRepository,
    private readonly mapper: RadarPublicationMapper,
    private readonly inbox: NotificationsInboxService,
  ) {}

  async list(userId: string) {
    const notifications = await this.inbox.findByType(
      userId,
      'RADAR_PUBLISHED',
    );
    const entries = await Promise.all(
      notifications.map(async (notification) => {
        const snapshotId = notification.groupKey?.match(
          /^radar:([0-9a-f-]{36})$/i,
        )?.[1];
        if (!snapshotId) return null;
        const [snapshot] = await this.repository.findSnapshot(
          userId,
          snapshotId,
        );
        return snapshot
          ? {
              id: notification.id,
              message: 'Tu radar se ha actualizado',
              version: snapshot.version,
              createdAt: notification.createdAt,
              readAt: notification.readAt,
            }
          : null;
      }),
    );
    return entries.filter((entry) => entry !== null);
  }

  async historical(userId: string, snapshotId: string) {
    const [snapshot] = await this.repository.findSnapshot(userId, snapshotId);
    if (!snapshot) throw new RadarPublicationNotFoundException();
    const [previous] = await this.repository.findPreviousSnapshot(
      userId,
      snapshot.version,
    );
    return this.mapper.historicalResponse(snapshot, previous);
  }

  async open(userId: string, notificationId: string) {
    const notifications = await this.inbox.findByType(
      userId,
      'RADAR_PUBLISHED',
    );
    const notification = notifications.find(
      (entry) => entry.id === notificationId,
    );
    const snapshotId = notification?.groupKey?.match(
      /^radar:([0-9a-f-]{36})$/i,
    )?.[1];
    if (!snapshotId) throw new RadarNotificationNotFoundException();
    const snapshots = await this.repository.findSnapshot(userId, snapshotId);
    const snapshot = snapshots[0];

    if (!snapshot) {
      throw new RadarNotificationNotFoundException();
    }

    const previousSnapshots = await this.repository.findPreviousSnapshot(
      userId,
      snapshot.version,
    );

    const previous = previousSnapshots[0];

    const radar = this.mapper.historicalResponse(snapshot, previous);

    await this.inbox.markAsRead(userId, notificationId);

    return {
      notification: {
        id: notificationId,
        version: snapshot.version,
        readAt: notification?.readAt ?? new Date(),
      },
      radar,
      compare: radar.previous !== null,
    };
  }
}
