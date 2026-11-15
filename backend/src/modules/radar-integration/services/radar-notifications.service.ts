import { Injectable, NotFoundException } from '@nestjs/common';
import { RadarNotificationsRepository } from '../repositories/radar-notifications.repository.js';
import { RadarPublicationMapper } from '../mappers/radar-publication.mapper.js';

@Injectable()
export class RadarNotificationsService {
  constructor(
    private readonly repository: RadarNotificationsRepository,
    private readonly mapper: RadarPublicationMapper,
  ) {}

  async list(userId: string) {
    const notifications = await this.repository.list(userId);

    return notifications.map((notification) => ({
      id: notification.id,
      message: 'Tu radar se ha actualizado',
      version: notification.version,
      createdAt: notification.created_at,
      readAt: notification.read_at,
    }));
  }

  async open(userId: string, notificationId: string) {
    const snapshots = await this.repository.findSnapshot(
      userId,
      notificationId,
    );

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

    const notification = await this.repository.markAsRead(
      userId,
      notificationId,
    );

    if (!notification) {
      throw new NotFoundException('Notificaci\u00f3n no encontrada.');
    }

    return {
      notification: {
        id: notification.id,
        version: snapshot.version,
        readAt: notification.read_at,
      },
      radar,
      compare: radar.previous !== null,
    };
  }
}