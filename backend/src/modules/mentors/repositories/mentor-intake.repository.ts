import { DAY_MS } from '../../../common/constants/date-time.constants.js';
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
  ): Promise<MentorCachedAttempt | undefined> {
    const cached = await tx.mentorIntakeAttempt.findUnique({
      where: { userId_operation_idempotencyKey: { userId, operation, idempotencyKey: key } },
      select: { payloadHash: true, responseData: true },
    });
    return cached ? { payloadHash: cached.payloadHash, outcome: cached.responseData as unknown as MentorIntakeOutcome } : undefined;
  }

  async activeSanction(
    tx: Prisma.TransactionClient,
    userId: string,
    now: Date,
  ) {
    return (await tx.mentorParticipationSanction.findFirst({
      where: { userId, endsAt: { gt: now } },
      orderBy: { endsAt: 'desc' },
      select: { endsAt: true },
    })) ?? undefined;
  }

  async attemptCount(tx: Prisma.TransactionClient, userId: string, now: Date) {
    return tx.mentorIntakeAttempt.count({
      where: { userId, counted: true, occurredAt: { gt: new Date(now.getTime() - DAY_MS), lte: now } },
    });
  }

  async saveAttempt(
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
    const { count } = await tx.mentorIntakeAttempt.createMany({
      data: [{ id, userId, operation, idempotencyKey: key, payloadHash, occurredAt: now,
        counted, responseStatus: result.status,
        responseData: JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue }],
    });
    return count;
  }

  async saveSanction(
    tx: Prisma.TransactionClient,
    userId: string,
    attemptId: string,
    now: Date,
    endsAt: Date,
  ) {
    await tx.mentorParticipationSanction.create({
      data: { userId, triggerAttemptId: attemptId, startedAt: now, endsAt },
      select: { id: true },
    });
  }
}
