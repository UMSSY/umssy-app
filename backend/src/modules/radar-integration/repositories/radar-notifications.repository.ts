
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { SnapshotRow } from '../types/snapshot-row.type.js';

@Injectable()
export class RadarNotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.$queryRaw<
      {
        id: string;
        snapshot_id: string;
        version: number;
        created_at: Date;
        read_at: Date | null;
      }[]
    >`
      SELECT
        n.id,
        n.snapshot_id,
        s.version,
        n.created_at,
        n.read_at
      FROM radar_notifications n
      INNER JOIN radar_score_snapshots s
        ON s.id = n.snapshot_id
      WHERE n.user_id = ${userId}::uuid
      ORDER BY n.created_at DESC, n.id DESC`;
  }

  async markAsRead(userId: string, notificationId: string) {
    const rows = await this.prisma.$queryRaw<
      { id: string; read_at: Date }[]
    >`
      UPDATE radar_notifications
      SET read_at = COALESCE(read_at, clock_timestamp())
      WHERE id = ${notificationId}::uuid
        AND user_id = ${userId}::uuid
      RETURNING id, read_at`;

    return rows[0] ?? null;
  }

  findPreviousSnapshot(userId: string, version: number) {
    return this.prisma.$queryRaw<
      SnapshotRow[]
    >`
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
  findSnapshot(userId: string, notificationId: string) {
    return this.prisma.$queryRaw<
      SnapshotRow[]
    >`
      SELECT
        s.*,
        (a.details->>'sourceRevision')::integer AS source_revision,
        COALESCE(a.details->'skills', '[]'::jsonb) AS skills
      FROM radar_notifications n
      INNER JOIN radar_score_snapshots s
        ON s.id = n.snapshot_id
      LEFT JOIN LATERAL (
        SELECT details
        FROM radar_audit_events
        WHERE user_id = s.user_id
          AND event_type IN ('radar.published', 'radar.synchronized')
          AND details->>'version' = s.version::text
        ORDER BY occurred_at DESC, id DESC
        LIMIT 1
      ) a ON TRUE
      WHERE n.id = ${notificationId}::uuid
        AND n.user_id = ${userId}::uuid
      LIMIT 1`;
  }
}
