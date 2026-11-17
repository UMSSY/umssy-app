import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { RadarNotificationsRepository } from '../repositories/radar-notifications.repository.js';

const userId = '11111111-1111-4111-8111-111111111111';
const snapshotId = '33333333-3333-4333-8333-333333333333';

describe('RadarNotificationsRepository', () => {
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

    const result = await repository.findSnapshot(userId, snapshotId);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(snapshotId);
    expect(result[0].source_revision).toBe(3);

    expect(db.$queryRaw.mock.calls[0].slice(1)).toEqual([snapshotId, userId]);

    const sql = db.$queryRaw.mock.calls[0][0].join('');

    expect(sql).toContain('WHERE s.id = ');
    expect(sql).toContain('AND s.user_id = ');
  });
});
