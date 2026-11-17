import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { RadarNotificationsRepository } from '../repositories/radar-notifications.repository.js';

const userId = '11111111-1111-4111-8111-111111111111';
const notificationId = '22222222-2222-4222-8222-222222222222';
const snapshotId = '33333333-3333-4333-8333-333333333333';

describe('RadarNotificationsRepository', () => {
  it('lists only notifications belonging to the requested user', async () => {
    const db = {
      $queryRaw: vi.fn().mockResolvedValue([
        {
          id: notificationId,
          snapshot_id: snapshotId,
          version: 2,
          created_at: new Date('2026-11-14T12:00:00Z'),
          read_at: null,
        },
      ]),
    };

    const repository = new RadarNotificationsRepository(
      db as unknown as PrismaService,
    );

    const result = await repository.list(userId);

    expect(result).toHaveLength(1);
    expect(result[0].snapshot_id).toBe(snapshotId);
    expect(db.$queryRaw.mock.calls[0][1]).toBe(userId);

    const sql = db.$queryRaw.mock.calls[0][0].join('');

    expect(sql).toContain('WHERE n.recipient_id = ');
    expect(sql).toContain("nt.code = 'RADAR_PUBLISHED'");
    expect(sql).toContain('ORDER BY n.created_at DESC, n.id DESC');
  });

  it('marks a notification as read only for its owner', async () => {
    const readAt = new Date('2026-11-14T12:30:00Z');
    const db = {
      $queryRaw: vi
        .fn()
        .mockResolvedValue([{ id: notificationId, read_at: readAt }]),
    };

    const repository = new RadarNotificationsRepository(
      db as unknown as PrismaService,
    );

    expect(await repository.markAsRead(userId, notificationId)).toEqual({
      id: notificationId,
      read_at: readAt,
    });

    expect(db.$queryRaw.mock.calls[0].slice(1)).toEqual([
      notificationId,
      userId,
    ]);

    const sql = db.$queryRaw.mock.calls[0][0].join('');

    expect(sql).toContain('COALESCE(n.read_at, clock_timestamp())');
    expect(sql).toContain('AND n.recipient_id = ');
    expect(sql).toContain("nt.code = 'RADAR_PUBLISHED'");
  });

  it('returns null when the notification does not belong to the user', async () => {
    const db = {
      $queryRaw: vi.fn().mockResolvedValue([]),
    };

    const repository = new RadarNotificationsRepository(
      db as unknown as PrismaService,
    );

    expect(await repository.markAsRead(userId, notificationId)).toBeNull();
  });

  it('finds the snapshot linked to a notification owned by the user', async () => {
    const db = {
      $queryRaw: vi.fn().mockResolvedValue([
        {
          id: snapshotId,
          user_id: userId,
          version: 2,
          rubric_version: 'v1',
          fingerprint: 'fingerprint',
          scores: {},
          evidence: {},
          average_score: 6.5,
          created_at: new Date('2026-11-14T12:00:00Z'),
          source_revision: 3,
          skills: [],
        },
      ]),
    };

    const repository = new RadarNotificationsRepository(
      db as unknown as PrismaService,
    );

    const result = await repository.findSnapshot(userId, notificationId);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(snapshotId);
    expect(result[0].source_revision).toBe(3);

    expect(db.$queryRaw.mock.calls[0].slice(1)).toEqual([
      notificationId,
      userId,
    ]);

    const sql = db.$queryRaw.mock.calls[0][0].join('');

    expect(sql).toContain('WHERE n.id = ');
    expect(sql).toContain('AND n.recipient_id = ');
    expect(sql).toContain("nt.code = 'RADAR_PUBLISHED'");
  });
});
