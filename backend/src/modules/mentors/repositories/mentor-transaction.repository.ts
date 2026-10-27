import type { MentorAdmissionFacts } from '../types/mentor-admission-facts.types.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { withMentorCapacityLock } from './mentor-capacity-lock.js';
import type { MentorTransaction } from '../types/mentor-transaction.types.js';
import { readMentorCapacityCounts } from './mentor-capacity.queries.js';
import type { MentorCachedAttempt } from '../types/mentor-cached-attempt.types.js';
import type { MentorIntakeOutcome } from '../types/mentor-intake-outcome.types.js';

export abstract class MentorTransactionRepository {
  constructor(protected readonly prisma: PrismaService) {}

  withUtcRead<T>(action: (tx: MentorTransaction) => Promise<T>) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL TIME ZONE 'UTC'`;
      return action(tx);
    });
  }

  withLock<T>(action: (tx: MentorTransaction) => Promise<T>) {
    return withMentorCapacityLock(this.prisma, action);
  }

  capacityCounts(tx: MentorTransaction = this.prisma) {
    return readMentorCapacityCounts(tx);
  }

  async admissionFacts(
    userId: string,
    tx: MentorTransaction,
  ): Promise<MentorAdmissionFacts> {
    const [facts] = await tx.$queryRaw<MentorAdmissionFacts[]>`
      SELECT EXISTS (SELECT 1 FROM users WHERE id = ${userId}::uuid AND is_active = true) AS "isActive",
        EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = ${userId}::uuid AND r.name = 'titulado' AND ur.deleted_at IS NULL
            AND ur.start_at <= clock_timestamp()) AS "hasGraduateRole",
        EXISTS (SELECT 1 FROM access_requests ar JOIN access_request_statuses s ON s.id = ar.status_id
          WHERE ar.approved_user_id = ${userId}::uuid AND s.title = 'approved') AS "hasApprovedAccount",
        EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = ${userId}::uuid AND r.name = 'mentor' AND ur.deleted_at IS NULL
            AND ur.start_at <= clock_timestamp()) AS "alreadyMentor"`;
    return facts;
  }

  async expireOffers(tx: MentorTransaction) {
    await tx.$executeRaw`
    WITH expired AS (
      UPDATE mentor_slot_offers SET status_id = mentor_offer_status('EXPIRED')
      WHERE status_id = mentor_offer_status('OFFERED') AND expires_at <= clock_timestamp()
      RETURNING request_id
    )
    UPDATE mentor_participation_requests SET status_id = mentor_request_status('EXPIRED')
    WHERE status_id = mentor_request_status('OFFERED') AND id IN (SELECT request_id FROM expired)
  `;
  }

  async allocateOffers(tx: MentorTransaction, available: number) {
    await tx.$executeRaw`
    WITH instant AS MATERIALIZED (SELECT clock_timestamp() AS now), next_requests AS (
      SELECT r.id, r.user_id FROM mentor_participation_requests r
      JOIN users u ON u.id = r.user_id
      WHERE r.status_id = mentor_request_status('PENDING') AND u.is_active = true
        AND EXISTS (SELECT 1 FROM access_requests ar JOIN access_request_statuses s ON s.id = ar.status_id
          WHERE ar.approved_user_id = u.id AND s.title = 'approved')
        AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles role ON role.id = ur.role_id
          WHERE ur.user_id = u.id AND role.name = 'titulado' AND ur.deleted_at IS NULL
            AND ur.start_at <= (SELECT now FROM instant))
        AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles role ON role.id = ur.role_id
          WHERE ur.user_id = u.id AND role.name = 'mentor' AND ur.deleted_at IS NULL
            AND ur.start_at <= (SELECT now FROM instant))
        AND NOT EXISTS (SELECT 1 FROM mentor_slot_offers o
          WHERE o.request_id = r.id OR (o.user_id = u.id AND o.status_id = mentor_offer_status('OFFERED')))
        AND cardinality(r.technical_area_ids) > 0 AND cardinality(r.orientation_type_ids) > 0
        AND (SELECT count(*) FROM technical_areas a WHERE a.id = ANY(r.technical_area_ids)) = cardinality(r.technical_area_ids)
        AND (SELECT count(*) FROM orientation_types o WHERE o.id = ANY(r.orientation_type_ids)
          AND o.is_active = true) = cardinality(r.orientation_type_ids)
      ORDER BY r.queued_at ASC, r.id ASC LIMIT ${available} FOR UPDATE OF r
    ), offered AS (
      INSERT INTO mentor_slot_offers (id, user_id, request_id, offered_at, expires_at)
      SELECT gen_random_uuid(), r.user_id, r.id, instant.now, instant.now + interval '24 hours'
      FROM next_requests r CROSS JOIN instant RETURNING id, user_id, request_id, expires_at
    ), mail AS (
      INSERT INTO mentor_mail_outbox(id, event_key, kind_id, user_id, recipient, payload)
      SELECT gen_random_uuid(), 'offer:' || o.id::text, mentor_mail_kind('OFFER'), o.user_id, u.email,
        jsonb_build_object('offerId', o.id, 'expiresAt', o.expires_at)
      FROM offered o JOIN users u ON u.id = o.user_id
      ON CONFLICT(event_key) DO NOTHING
      RETURNING id
    )
    UPDATE mentor_participation_requests SET status_id = mentor_request_status('OFFERED')
    WHERE id IN (SELECT request_id FROM offered)
  `;
  }

  async now(tx: MentorTransaction) {
    const [{ now }] = await tx.$queryRaw<
      { now: Date }[]
    >`SELECT clock_timestamp() AS now`;
    return now;
  }

  async cachedAttempt(
    tx: MentorTransaction,
    userId: string,
    operation: string,
    key: string,
  ) {
    const [cached] = await tx.$queryRaw<MentorCachedAttempt[]>`
      SELECT payload_hash AS "payloadHash", response_data AS outcome FROM mentor_intake_attempts
      WHERE user_id = ${userId}::uuid AND operation_id = mentor_intake_operation(${operation}) AND idempotency_key = ${key}::uuid`;
    return cached;
  }

  async activeSanction(tx: MentorTransaction, userId: string, now: Date) {
    const [active] = await tx.$queryRaw<{ endsAt: Date }[]>`
      SELECT ends_at AS "endsAt" FROM mentor_participation_sanctions
      WHERE user_id = ${userId}::uuid AND ends_at > ${now} ORDER BY ends_at DESC LIMIT 1`;
    return active;
  }

  async attemptCount(tx: MentorTransaction, userId: string, now: Date) {
    const [{ count }] = await tx.$queryRaw<{ count: number }[]>`
      SELECT count(*)::int AS count FROM mentor_intake_attempts WHERE user_id = ${userId}::uuid
        AND counted AND occurred_at > ${now}::timestamptz - INTERVAL '24 hours' AND occurred_at <= ${now}`;
    return count;
  }

  saveAttempt(
    tx: MentorTransaction,
    id: string,
    userId: string,
    operation: string,
    key: string,
    payloadHash: string,
    now: Date,
    counted: boolean,
    result: MentorIntakeOutcome,
  ) {
    return tx.$executeRaw`
      INSERT INTO mentor_intake_attempts(id, user_id, operation_id, idempotency_key, payload_hash, occurred_at, counted, response_status, response_data)
      VALUES (${id}::uuid, ${userId}::uuid, mentor_intake_operation(${operation}), ${key}::uuid, ${payloadHash}, ${now}, ${counted}, ${result.status}, ${JSON.stringify(result)}::jsonb)`;
  }

  async saveSanction(
    tx: MentorTransaction,
    userId: string,
    attemptId: string,
    now: Date,
    endsAt: Date,
  ) {
    const [sanction] = await tx.$queryRaw<{ id: string }[]>`
      INSERT INTO mentor_participation_sanctions(id, user_id, trigger_attempt_id, started_at, ends_at)
      VALUES (gen_random_uuid(), ${userId}::uuid, ${attemptId}::uuid, ${now}, ${endsAt}) RETURNING id`;
    await tx.$executeRaw`
      INSERT INTO mentor_mail_outbox(id, event_key, kind_id, user_id, recipient, payload)
      SELECT gen_random_uuid(), ${'sanction:' + sanction.id}, mentor_mail_kind('SANCTION'), u.id, u.email,
        jsonb_build_object('sanctionEndsAt', ${endsAt.toISOString()}::text)
      FROM users u WHERE u.id = ${userId}::uuid ON CONFLICT(event_key) DO NOTHING`;
  }

  role(tx: MentorTransaction) {
    return tx.role.findUnique({
      where: { name: 'mentor' },
      select: { id: true },
    });
  }

  async preferenceCounts(
    tx: MentorTransaction,
    technicalAreaIds: string[],
    orientationTypeIds: string[],
  ) {
    const [areas, orientations] = await Promise.all([
      tx.technicalArea.count({ where: { id: { in: technicalAreaIds } } }),
      tx.orientationType.count({
        where: { id: { in: orientationTypeIds }, isActive: true },
      }),
    ]);
    return { areas, orientations };
  }
}
