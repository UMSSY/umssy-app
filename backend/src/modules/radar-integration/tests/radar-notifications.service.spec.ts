import type { NotificationsInboxService } from '../../notifications/services/notifications-inbox.service.js';
import { describe, expect, it, vi } from 'vitest';
import type { SnapshotRow } from '../types/snapshot-row.types.js';
import type { RadarNotificationsRepository } from '../repositories/radar-notifications.repository.js';
import { RadarPublicationMapper } from '../mappers/radar-publication.mapper.js';
import { RadarNotificationsService } from '../services/radar-notifications.service.js';

const userId = '11111111-1111-4111-8111-111111111111';
const notificationId = '22222222-2222-4222-8222-222222222222';

function setup() {
  const createdAt = new Date('2026-11-14T12:00:00Z');
  const previousCreatedAt = new Date('2026-11-13T12:00:00Z');
  const readAt = new Date('2026-11-14T12:30:00Z');

  const snapshot = {
    id: '33333333-3333-4333-8333-333333333333',
    user_id: userId,
    version: 2,
    rubric_version: '1',
    fingerprint: 'snapshot-v2',
    scores: {},
    evidence: {},
    average_score: 7,
    created_at: createdAt,
    source_revision: 4,
    skills: [],
  } as unknown as SnapshotRow;

  const previousSnapshot = {
    ...snapshot,
    id: '44444444-4444-4444-8444-444444444444',
    version: 1,
    average_score: 6,
    created_at: previousCreatedAt,
  };

  const historical = {
    userId,
    status: 'published' as const,
    version: 2,
    sourceRevision: 4,
    rubricVersion: '1',
    updatedAt: createdAt,
    scores: snapshot.scores,
    average: 7,
    variation: 1,
    evidence: snapshot.evidence,
    skills: snapshot.skills,
  };

  const repository = {
    findSnapshot: vi.fn().mockResolvedValue([snapshot]),
    findPreviousSnapshot: vi.fn().mockResolvedValue([previousSnapshot]),
  };
  const inbox = {
    findByType: vi.fn().mockResolvedValue([
      {
        id: notificationId,
        groupKey: `radar:${snapshot.id}`,
        createdAt,
        readAt: null,
      },
    ]),
    markAsRead: vi.fn().mockResolvedValue({ ok: true }),
  };

  const publicationMapper = new RadarPublicationMapper();
  const mapper = {
    snapshotResponse: vi
      .spyOn(publicationMapper, 'snapshotResponse')
      .mockReturnValue(historical),
    historicalResponse:
      publicationMapper.historicalResponse.bind(publicationMapper),
  };

  const service = new RadarNotificationsService(
    repository as unknown as RadarNotificationsRepository,
    mapper as unknown as RadarPublicationMapper,
    inbox as unknown as NotificationsInboxService,
  );

  return {
    repository,
    inbox,
    mapper,
    service,
    snapshot,
    previousSnapshot,
    historical,
    createdAt,
    previousCreatedAt,
    readAt,
  };
}

describe('RadarNotificationsService', () => {
  it('uses the same historical response for direct access and notification opening', async () => {
    const { service, snapshot } = setup();
    const historical = await service.historical(userId, snapshot.id);
    const opened = await service.open(userId, notificationId);
    expect(opened.radar).toEqual(historical);
  });

  it('returns a domain 404 when a historical publication is missing', async () => {
    const { service, repository, snapshot } = setup();
    repository.findSnapshot.mockResolvedValue([]);
    await expect(service.historical(userId, snapshot.id)).rejects.toMatchObject(
      {
        statusCode: 404,
        code: 'RADAR_PUBLICATION_NOT_FOUND',
      },
    );
  });

  it('returns a domain 404 when the notification is missing', async () => {
    const { service, inbox, repository } = setup();
    inbox.findByType.mockResolvedValue([]);
    await expect(service.open(userId, notificationId)).rejects.toMatchObject({
      statusCode: 404,
      code: 'RADAR_NOTIFICATION_NOT_FOUND',
    });
    expect(repository.findSnapshot).not.toHaveBeenCalled();
    expect(inbox.markAsRead).not.toHaveBeenCalled();
  });

  it('lists the owner notifications with the required message', async () => {
    const { service, inbox, createdAt, snapshot } = setup();

    await expect(service.list(userId)).resolves.toEqual([
      {
        id: notificationId,
        snapshotId: snapshot.id,
        message: 'Tu radar se ha actualizado',
        version: 2,
        createdAt,
        readAt: null,
      },
    ]);

    expect(inbox.findByType).toHaveBeenCalledWith(userId, 'RADAR_PUBLISHED');
  });

  it('opens the exact historical snapshot and marks the notification as read', async () => {
    const {
      service,
      repository,
      inbox,
      mapper,
      snapshot,
      previousSnapshot,
      historical,
      previousCreatedAt,
    } = setup();

    await expect(service.open(userId, notificationId)).resolves.toEqual({
      notification: {
        id: notificationId,
        version: 2,
        readAt: expect.any(Date),
      },
      radar: {
        ...historical,
        previous: {
          version: 1,
          updatedAt: previousCreatedAt,
          scores: previousSnapshot.scores,
        },
        pending: 0,
        hasPending: false,
        processingStatus: 'ready',
        inputRevision: 4,
        dictionaryVersion: null,
      },
      compare: true,
    });

    expect(repository.findSnapshot).toHaveBeenCalledWith(userId, snapshot.id);
    expect(repository.findPreviousSnapshot).toHaveBeenCalledWith(
      userId,
      snapshot.version,
    );
    expect(mapper.snapshotResponse).toHaveBeenCalledWith(
      snapshot,
      previousSnapshot,
    );
    expect(inbox.markAsRead).toHaveBeenCalledWith(userId, notificationId);
    expect(mapper.snapshotResponse.mock.invocationCallOrder[0]).toBeLessThan(
      inbox.markAsRead.mock.invocationCallOrder[0],
    );
  });

  it('does not mark a notification as read when it does not belong to the owner', async () => {
    const { service, repository, inbox, mapper } = setup();
    repository.findSnapshot.mockResolvedValue([]);

    await expect(service.open(userId, notificationId)).rejects.toThrow(
      'Notificación no encontrada.',
    );

    expect(repository.findPreviousSnapshot).not.toHaveBeenCalled();
    expect(mapper.snapshotResponse).not.toHaveBeenCalled();
    expect(inbox.markAsRead).not.toHaveBeenCalled();
  });

  it('does not mark the notification as read when loading the previous snapshot fails', async () => {
    const { service, repository, inbox } = setup();
    repository.findPreviousSnapshot.mockRejectedValue(
      new Error('Previous snapshot unavailable'),
    );

    await expect(service.open(userId, notificationId)).rejects.toThrow(
      'Previous snapshot unavailable',
    );

    expect(inbox.markAsRead).not.toHaveBeenCalled();
  });

  it('does not enable comparison when there is no previous snapshot', async () => {
    const { service, repository, mapper, snapshot, historical } = setup();
    repository.findPreviousSnapshot.mockResolvedValue([]);

    await expect(service.open(userId, notificationId)).resolves.toMatchObject({
      radar: {
        ...historical,
        previous: null,
      },
      compare: false,
    });

    expect(mapper.snapshotResponse).toHaveBeenCalledWith(snapshot, undefined);
  });

  it('does not return successfully when marking the notification as read fails', async () => {
    const { service, inbox } = setup();
    inbox.markAsRead.mockRejectedValue(
      new Error('Notificaci\u00f3n no encontrada.'),
    );

    await expect(service.open(userId, notificationId)).rejects.toThrow(
      'Notificación no encontrada.',
    );
  });
});
