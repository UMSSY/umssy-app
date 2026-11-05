import { Injectable } from '@nestjs/common';
import type { Prisma as PrismaTypes } from '../../../prisma/client.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { RUBRIC_VERSION, scoreVerifiedSkills } from '../radar-scoring.js';
import type {
  PublishedSkill,
  SnapshotRow,
} from '../types/radar-publication.types.js';

// Todas las operaciones comparten la transacción y el bloqueo de publicación.
export class RadarPublicationTransaction {
  constructor(private readonly tx: PrismaTypes.TransactionClient) {}

  async lockAndReadRevision(userId: string) {
    const lock = await this.tx.$queryRaw<
      { locked: number; started_at: Date }[]
    >`
      SELECT 1 AS locked,clock_timestamp() AS started_at FROM pg_advisory_xact_lock(hashtext(${userId}))`;
    const states = await this.tx.$queryRaw<
      {
        input_revision: number;
        processed_revision: number | null;
        status: string;
      }[]
    >`
      SELECT input_revision,processed_revision,status FROM profile_skill_processing_states
      WHERE user_id=${userId}::uuid FOR SHARE`;
    return { startedAt: lock[0]?.started_at ?? new Date(), state: states[0] };
  }

  snapshots(userId: string, limit: number) {
    return querySnapshots(this.tx, userId, limit);
  }

  async recordSynchronized(
    userId: string,
    actorId: string | null,
    version: number,
    revision: number,
    skills: PublishedSkill[],
  ): Promise<void> {
    await this.tx.$executeRaw`
      INSERT INTO radar_audit_events (user_id,actor_id,event_type,details,occurred_at)
      VALUES (${userId}::uuid,${actorId}::uuid,'radar.synchronized',
        ${JSON.stringify({ version, sourceRevision: revision, skills })}::jsonb,clock_timestamp())`;
  }

  insertSnapshot(
    userId: string,
    version: number,
    calculated: ReturnType<typeof scoreVerifiedSkills>,
  ) {
    return this.tx.$queryRaw<SnapshotRow[]>`
      INSERT INTO radar_score_snapshots (user_id,version,rubric_version,fingerprint,scores,evidence,average_score)
      VALUES (${userId}::uuid,${version},${RUBRIC_VERSION},${calculated.fingerprint},
        ${JSON.stringify(calculated.scores)}::jsonb,${JSON.stringify(calculated.evidence)}::jsonb,${calculated.average})
      RETURNING *`;
  }

  async recordPublished(
    userId: string,
    actorId: string | null,
    version: number,
    revision: number,
    skills: PublishedSkill[],
  ): Promise<void> {
    await this.tx.$executeRaw`
      INSERT INTO radar_audit_events (user_id,actor_id,event_type,details,occurred_at)
      VALUES (${userId}::uuid,${actorId}::uuid,'radar.published',
        ${JSON.stringify({ version, rubric: RUBRIC_VERSION, sourceRevision: revision, skills })}::jsonb,clock_timestamp())`;
  }
}

function querySnapshots(
  client: PrismaService | PrismaTypes.TransactionClient,
  userId: string,
  limit: number,
) {
  return client.$queryRaw<SnapshotRow[]>`
    SELECT s.*,(a.details->>'sourceRevision')::integer AS source_revision,
      COALESCE(a.details->'skills','[]'::jsonb) AS skills
    FROM radar_score_snapshots s
    LEFT JOIN LATERAL (SELECT details FROM radar_audit_events WHERE user_id=s.user_id
      AND event_type IN ('radar.published','radar.synchronized') AND details->>'version'=s.version::text
      AND details ? 'skills' ORDER BY occurred_at DESC,id DESC LIMIT 1) a ON TRUE
    WHERE s.user_id=${userId}::uuid ORDER BY s.version DESC LIMIT ${limit}`;
}

@Injectable()
export class RadarPublicationRepository {
  constructor(private readonly prisma: PrismaService) {}

  withTransaction<T>(
    operation: (
      store: RadarPublicationTransaction,
      context: TransactionContext,
    ) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) =>
      operation(new RadarPublicationTransaction(tx), { client: tx }),
    );
  }

  snapshots(userId: string, limit: number) {
    return querySnapshots(this.prisma, userId, limit);
  }

  async radarState(userId: string) {
    const [snapshots, pendingDocs, state, attempts] = await Promise.all([
      this.snapshots(userId, 2),
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count FROM radar_cv_evidence e
        JOIN radar_cv_review_statuses review ON review.id=e.review_status_id
        WHERE e.user_id=${userId}::uuid AND review.title='pending'`,
      this.prisma.profileSkillProcessingState.findUnique({
        where: { userId },
        select: {
          status: true,
          inputRevision: true,
          processedRevision: true,
          dictionaryVersion: true,
        },
      }),
      this.prisma.$queryRaw<
        { source_revision: number | null; status: string }[]
      >`
        SELECT COALESCE((details->>'sourceRevision')::integer,(details->>'revision')::integer) AS source_revision,
          CASE WHEN event_type='radar.recalculation_failed' THEN 'error' ELSE 'ready' END AS status
        FROM radar_audit_events WHERE user_id=${userId}::uuid
          AND event_type IN ('radar.published','radar.synchronized','radar.recalculation_failed')
        ORDER BY occurred_at DESC,id DESC LIMIT 1`,
    ]);
    return { snapshots, pendingDocs, state, attempts };
  }

  async recordFailure(
    userId: string,
    actorId: string | null,
    revision: number,
    attemptStartedAt: Date,
  ) {
    await this.prisma.$executeRaw`
      INSERT INTO radar_audit_events (user_id,actor_id,event_type,details,occurred_at)
      SELECT ${userId}::uuid,${actorId}::uuid,'radar.recalculation_failed',
        ${JSON.stringify({ revision })}::jsonb,clock_timestamp()
      WHERE NOT EXISTS (SELECT 1 FROM radar_audit_events WHERE user_id=${userId}::uuid
        AND event_type IN ('radar.published','radar.synchronized')
        AND (details->>'sourceRevision')::integer>=${revision}
        AND occurred_at>=${attemptStartedAt}::timestamptz)`;
  }
}
