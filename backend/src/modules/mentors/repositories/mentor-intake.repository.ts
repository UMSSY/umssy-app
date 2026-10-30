import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Prisma } from '../../../prisma/client.js';
import type { MentorCachedAttempt } from '../types/mentor-cached-attempt.types.js';
import type { MentorIntakeOutcome } from '../types/mentor-intake-outcome.types.js';
import { withMentorCapacityLock } from './mentor-capacity-lock.js';

export abstract class MentorIntakeRepository {
  constructor(protected readonly prisma: PrismaService) {}

  withLock<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>) {
    return withMentorCapacityLock(this.prisma, operation);
  }

  async now(tx: Prisma.TransactionClient) {
    const [{ now }] = await tx.$queryRaw<
      { now: Date }[]
    >`SELECT clock_timestamp() AS now`;
    return now;
  }

  async cachedAttempt(
    tx: Prisma.TransactionClient,
    userId: string,
    operation: string,
    key: string,
  ) {
    const [cached] = await tx.$queryRaw<MentorCachedAttempt[]>`
      SELECT payload_hash AS "payloadHash", response_data AS outcome FROM mentor_intake_attempts
      WHERE user_id = ${userId}::uuid AND operation = ${operation} AND idempotency_key = ${key}::uuid`;
    return cached;
  }

  async activeSanction(
    tx: Prisma.TransactionClient,
    userId: string,
    now: Date,
  ) {
    const [active] = await tx.$queryRaw<{ endsAt: Date }[]>`
      SELECT ends_at AS "endsAt" FROM mentor_participation_sanctions
      WHERE user_id = ${userId}::uuid AND ends_at > ${now} ORDER BY ends_at DESC LIMIT 1`;
    return active;
  }

  async attemptCount(tx: Prisma.TransactionClient, userId: string, now: Date) {
    const [{ count }] = await tx.$queryRaw<{ count: number }[]>`
      SELECT count(*)::int AS count FROM mentor_intake_attempts WHERE user_id = ${userId}::uuid
        AND counted AND occurred_at > ${now}::timestamptz - INTERVAL '24 hours' AND occurred_at <= ${now}`;
    return count;
  }

  saveAttempt(
    tx: Prisma.TransactionClient,
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
      INSERT INTO mentor_intake_attempts(id, user_id, operation, idempotency_key, payload_hash, occurred_at, counted, response_status, response_data)
      VALUES (${id}::uuid, ${userId}::uuid, ${operation}, ${key}::uuid, ${payloadHash}, ${now}, ${counted}, ${result.status}, ${JSON.stringify(result)}::jsonb)`;
  }

  async saveSanction(
    tx: Prisma.TransactionClient,
    userId: string,
    attemptId: string,
    now: Date,
    endsAt: Date,
  ) {
    await tx.$executeRaw`
      INSERT INTO mentor_participation_sanctions(id, user_id, trigger_attempt_id, started_at, ends_at)
      VALUES (gen_random_uuid(), ${userId}::uuid, ${attemptId}::uuid, ${now}, ${endsAt})`;
  }
}
