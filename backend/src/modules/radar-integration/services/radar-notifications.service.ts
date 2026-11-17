import { NotificationsInboxService } from '../../notifications/services/notifications-inbox.service.js';
import { Injectable, NotFoundException } from '@nestjs/common';
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
    if (!snapshot)
      throw new NotFoundException('Publicaci\u00f3n no encontrada.');
    const [previous] = await this.repository.findPreviousSnapshot(
      userId,
      snapshot.version,
    );
    return {
      ...this.mapper.snapshotResponse(snapshot, previous),
      previous: previous
        ? {
            version: previous.version,
            updatedAt: previous.created_at,
            scores: previous.scores,
          }
        : null,
      pending: 0,
      hasPending: false,
      processingStatus: 'ready' as const,
      inputRevision: snapshot.source_revision ?? 0,
      dictionaryVersion: null,
    };
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
    if (!snapshotId)
      throw new NotFoundException('Notificaci\u00f3n no encontrada.');
    const snapshots = await this.repository.findSnapshot(userId, snapshotId);
    const snapshot = snapshots[0];

    if (!snapshot) {
      throw new NotFoundException('Notificaci\u00f3n no encontrada.');
    }

    const previousSnapshots = await this.repository.findPreviousSnapshot(
      userId,
      snapshot.version,
    );

    const previous = previousSnapshots[0];

    const historical = this.mapper.snapshotResponse(snapshot, previous);

    const radar = {
      ...historical,
      previous: previous
        ? {
            version: previous.version,
            updatedAt: previous.created_at,
            scores: previous.scores,
          }
        : null,
      pending: 0,
      hasPending: false,
      processingStatus: 'ready' as const,
      inputRevision: snapshot.source_revision ?? 0,
      dictionaryVersion: null,
    };

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
