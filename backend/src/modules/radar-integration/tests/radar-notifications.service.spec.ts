import { describe, expect, it, vi } from 'vitest';
import type { SnapshotRow } from '../types/snapshot-row.type.js';
import type { RadarNotificationsRepository } from '../repositories/radar-notifications.repository.js';
import type { RadarPublicationMapper } from '../mappers/radar-publication.mapper.js';
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
    list: vi.fn().mockResolvedValue([
      {
        id: notificationId,
        snapshot_id: snapshot.id,
        version: 2,
        created_at: createdAt,
        read_at: null,
      },
    ]),
    findSnapshot: vi.fn().mockResolvedValue([snapshot]),
    findPreviousSnapshot: vi.fn().mockResolvedValue([previousSnapshot]),
    markAsRead: vi.fn().mockResolvedValue({
      id: notificationId,
      read_at: readAt,
    }),
  };

  const mapper = {
    snapshotResponse: vi.fn().mockReturnValue(historical),
  };

  const service = new RadarNotificationsService(
    repository as unknown as RadarNotificationsRepository,
    mapper as unknown as RadarPublicationMapper,
  );

  return {
    repository,
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
  it('lists the owner notifications with the required message', async () => {
    const { service, repository, createdAt } = setup();

    await expect(service.list(userId)).resolves.toEqual([
      {
        id: notificationId,
        message: 'Tu radar se ha actualizado',
        version: 2,
        createdAt,
        readAt: null,
      },
    ]);

    expect(repository.list).toHaveBeenCalledWith(userId);
  });

  it('opens the exact historical snapshot and marks the notification as read', async () => {
    const {
      service,
      repository,
      mapper,
      snapshot,
      previousSnapshot,
      historical,
      previousCreatedAt,
      readAt,
    } = setup();

    await expect(
      service.open(userId, notificationId),
    ).resolves.toEqual({
      notification: {
        id: notificationId,
        version: 2,
        readAt,
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

    expect(repository.findSnapshot).toHaveBeenCalledWith(
      userId,
      notificationId,
    );
    expect(repository.findPreviousSnapshot).toHaveBeenCalledWith(
      userId,
      snapshot.version,
    );
    expect(mapper.snapshotResponse).toHaveBeenCalledWith(
      snapshot,
      previousSnapshot,
    );
    expect(repository.markAsRead).toHaveBeenCalledWith(
      userId,
      notificationId,
    );
    expect(mapper.snapshotResponse.mock.invocationCallOrder[0]).toBeLessThan(
      repository.markAsRead.mock.invocationCallOrder[0],
    );
  });

  it('does not mark a notification as read when it does not belong to the owner', async () => {
    const { service, repository, mapper } = setup();
    repository.findSnapshot.mockResolvedValue([]);

    await expect(
      service.open(userId, notificationId),
    ).rejects.toThrow('Notificación no encontrada.');

    expect(repository.findPreviousSnapshot).not.toHaveBeenCalled();
    expect(mapper.snapshotResponse).not.toHaveBeenCalled();
    expect(repository.markAsRead).not.toHaveBeenCalled();
  });

  it('does not mark the notification as read when loading the previous snapshot fails', async () => {
    const { service, repository } = setup();
    repository.findPreviousSnapshot.mockRejectedValue(
      new Error('Previous snapshot unavailable'),
    );

    await expect(
      service.open(userId, notificationId),
    ).rejects.toThrow('Previous snapshot unavailable');

    expect(repository.markAsRead).not.toHaveBeenCalled();
  });

  it('does not enable comparison when there is no previous snapshot', async () => {
    const { service, repository, mapper, snapshot, historical } = setup();
    repository.findPreviousSnapshot.mockResolvedValue([]);

    await expect(
      service.open(userId, notificationId),
    ).resolves.toMatchObject({
      radar: {
        ...historical,
        previous: null,
      },
      compare: false,
    });

    expect(mapper.snapshotResponse).toHaveBeenCalledWith(
      snapshot,
      undefined,
    );
  });

  it('does not return successfully when marking the notification as read fails', async () => {
    const { service, repository } = setup();
    repository.markAsRead.mockResolvedValue(null);

    await expect(
      service.open(userId, notificationId),
    ).rejects.toThrow('Notificación no encontrada.');
  });
});