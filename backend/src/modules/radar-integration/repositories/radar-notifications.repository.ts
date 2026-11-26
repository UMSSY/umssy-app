import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { SnapshotRow } from '../types/snapshot-row.types.js';

@Injectable()
export class RadarNotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPreviousSnapshot(userId: string, version: number) {
    return this.prisma.$queryRaw<SnapshotRow[]>`
      SELECT
        s.*,
        (a.details->>'sourceRevision')::integer AS source_revision,
        COALESCE(a.details->'skills', '[]'::jsonb) AS skills
      FROM radar_score_snapshots s
      LEFT JOIN LATERAL (
        SELECT details
        FROM radar_audit_events
        WHERE user_id = s.user_id
          AND event_type IN ('radar.published', 'radar.synchronized')
          AND details->>'version' = s.version::text
        ORDER BY occurred_at DESC, id DESC
        LIMIT 1
      ) a ON TRUE
      WHERE s.user_id = ${userId}::uuid
        AND s.version < ${version}
      ORDER BY s.version DESC
      LIMIT 1`;
  }
  findSnapshot(userId: string, snapshotId: string) {
    return this.prisma.$queryRaw<SnapshotRow[]>`
      SELECT s.*, (a.details->>'sourceRevision')::integer AS source_revision,
        COALESCE(a.details->'skills', '[]'::jsonb) AS skills
      FROM radar_score_snapshots s
      LEFT JOIN LATERAL (
        SELECT details FROM radar_audit_events
        WHERE user_id = s.user_id AND event_type IN ('radar.published', 'radar.synchronized')
          AND details->>'version' = s.version::text
        ORDER BY occurred_at DESC, id DESC LIMIT 1
      ) a ON TRUE
      WHERE s.id = ${snapshotId}::uuid AND s.user_id = ${userId}::uuid LIMIT 1`;
  }
}
