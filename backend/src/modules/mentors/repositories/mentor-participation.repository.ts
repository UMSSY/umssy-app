import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../prisma/client.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { withMentorCapacityLock } from './mentor-capacity-lock.js';
import {
  readMentorCapacity,
  readMentorEligibility,
} from './mentor-capacity.queries.js';
import { reconcileMentorOffers } from './mentor-offers.queries.js';

export interface MentorParticipationRequest {
  id: string;
  userId: string;
  status: string;
  queuedAt: Date;
  createdAt: Date;
  technicalAreaIds: string[];
  orientationTypeIds: string[];
}

const fields = Prisma.sql`id, user_id AS "userId", status, queued_at AS "queuedAt",
  created_at AS "createdAt", technical_area_ids AS "technicalAreaIds",
  orientation_type_ids AS "orientationTypeIds"`;

const ATTEMPT_WINDOW_MS = 24 * 60 * 60 * 1000;
const SANCTION_DURATION_MS = 72 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 4;

@Injectable()
export class MentorParticipationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async validatePreferences(
    tx: Prisma.TransactionClient,
    technicalAreaIds: string[],
    orientationTypeIds: string[],
  ) {
    if (
      !technicalAreaIds.length ||
      !orientationTypeIds.length ||
      new Set(technicalAreaIds).size !== technicalAreaIds.length ||
      new Set(orientationTypeIds).size !== orientationTypeIds.length
    )
      return false;
    const [areas, orientations] = await Promise.all([
      tx.technicalArea.count({ where: { id: { in: technicalAreaIds } } }),
      tx.orientationType.count({
        where: { id: { in: orientationTypeIds }, isActive: true },
      }),
    ]);
    return (
      areas === technicalAreaIds.length &&
      orientations === orientationTypeIds.length
    );
  }

  private async registerAttempt(
    tx: Prisma.TransactionClient,
    userId: string,
  ) {
    const now = new Date();

    const limit = await tx.mentorParticipationAttemptLimit.findUnique({
      where: { userId },
    });

    if (limit?.blockedUntil && limit.blockedUntil > now) {
      return {
        result: 'SANCTIONED' as const,
        blockedUntil: limit.blockedUntil,
      };
    }

    const windowExpired =
      !limit?.windowStartedAt ||
      now.getTime() - limit.windowStartedAt.getTime() >= ATTEMPT_WINDOW_MS;

    if (windowExpired || (limit?.blockedUntil && limit.blockedUntil <= now)) {
      await tx.mentorParticipationAttemptLimit.upsert({
        where: { userId },
        create: {
          userId,
          attemptCount: 1,
          windowStartedAt: now,
          blockedUntil: null,
        },
        update: {
          attemptCount: 1,
          windowStartedAt: now,
          blockedUntil: null,
        },
      });

      return { result: 'ALLOWED' as const };
    }

    const attemptCount = limit.attemptCount + 1;

    if (attemptCount > MAX_ATTEMPTS) {
      const blockedUntil = new Date(
        now.getTime() + SANCTION_DURATION_MS,
      );

      await tx.mentorParticipationAttemptLimit.update({
        where: { userId },
        data: {
          attemptCount,
          blockedUntil,
        },
      });

      return {
        result: 'SANCTIONED' as const,
        blockedUntil,
      };
    }

    await tx.mentorParticipationAttemptLimit.update({
      where: { userId },
      data: { attemptCount },
    });

    return { result: 'ALLOWED' as const };
  }

  createRequest(
    userId: string,
    technicalAreaIds: string[],
    orientationTypeIds: string[],
  ) {
    return withMentorCapacityLock(this.prisma, async (tx) => {
      const eligibility = await readMentorEligibility(tx, userId);
      if (!eligibility.eligible || eligibility.alreadyMentor)
        return { result: 'NOT_ELIGIBLE' as const };
      const attempt = await this.registerAttempt(tx, userId);
      if (attempt.result === 'SANCTIONED') return attempt;
      // Atiende la cola existente y vence ofertas antes de admitir otra solicitud.
      await reconcileMentorOffers(tx);
      const [existing] = await tx.$queryRaw<MentorParticipationRequest[]>`
        SELECT ${fields} FROM mentor_participation_requests
        WHERE user_id = ${userId}::uuid AND status IN ('PENDING', 'OFFERED')
        ORDER BY queued_at, id LIMIT 1`;
      if (existing)
        return { result: 'ALREADY_EXISTS' as const, request: existing };
      const [offer] = await tx.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (SELECT 1 FROM mentor_slot_offers
          WHERE user_id = ${userId}::uuid AND status = 'OFFERED'
            AND expires_at > clock_timestamp()) AS exists`;
      if (offer.exists) return { result: 'OFFER_EXISTS' as const };
      if (
        !(await this.validatePreferences(
          tx,
          technicalAreaIds,
          orientationTypeIds,
        ))
      ) {
        return { result: 'INVALID_PREFERENCES' as const };
      }
      const capacity = await readMentorCapacity(tx);
      if (capacity.available > 0)
        return { result: 'CAPACITY_AVAILABLE' as const };
      const [request] = await tx.$queryRaw<MentorParticipationRequest[]>`
        WITH instant AS MATERIALIZED (SELECT clock_timestamp() AS now)
        INSERT INTO mentor_participation_requests
          (id, user_id, status, queued_at, created_at, technical_area_ids, orientation_type_ids)
        SELECT gen_random_uuid(), ${userId}::uuid, 'PENDING', instant.now, instant.now,
          ARRAY[${Prisma.join(technicalAreaIds)}]::uuid[], ARRAY[${Prisma.join(orientationTypeIds)}]::uuid[]
        FROM instant RETURNING ${fields}`;
      return { result: 'CREATED' as const, request };
    });
  }

  findMyRequest(userId: string) {
    return withMentorCapacityLock(this.prisma, async (tx) => {
      await reconcileMentorOffers(tx);
      const request = await tx.mentorParticipationRequest.findFirst({
        where: { userId },
        orderBy: [{ queuedAt: 'desc' }, { id: 'desc' }],
        include: {
          offer: true,
          user: { select: { email: true } },
        },
      });
      if (!request) return null;
      // A direct activation can follow a cancelled/expired request. Its history
      // must not hide the user's current mentor role.
      if (!['PENDING', 'OFFERED', 'ACTIVE'].includes(request.status)) {
        const { alreadyMentor } = await readMentorEligibility(tx, userId);
        if (alreadyMentor) return null;
      }
      const { user, ...details } = request;
      return { ...details, email: user.email };
    });
  }

  findMyHistory(userId: string) {
    return this.prisma.$queryRaw<MentorParticipationRequest[]>`
      SELECT ${fields} FROM mentor_participation_requests WHERE user_id = ${userId}::uuid
      ORDER BY queued_at DESC, id DESC`;
  }

  updatePreferences(
    userId: string,
    technicalAreaIds: string[],
    orientationTypeIds: string[],
  ) {
    return withMentorCapacityLock(this.prisma, async (tx) => {
      const [pending] = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM mentor_participation_requests
        WHERE user_id = ${userId}::uuid AND status = 'PENDING' FOR UPDATE`;
      if (!pending) return { result: 'NOT_FOUND' as const };
      if (
        !(await this.validatePreferences(
          tx,
          technicalAreaIds,
          orientationTypeIds,
        ))
      ) {
        return { result: 'INVALID_PREFERENCES' as const };
      }
      const [request] = await tx.$queryRaw<MentorParticipationRequest[]>`
        UPDATE mentor_participation_requests
        SET technical_area_ids = ARRAY[${Prisma.join(technicalAreaIds)}]::uuid[],
          orientation_type_ids = ARRAY[${Prisma.join(orientationTypeIds)}]::uuid[]
        WHERE id = ${pending.id}::uuid RETURNING ${fields}`;
      return { result: 'UPDATED' as const, request };
    });
  }

  cancelRequest(userId: string) {
    return withMentorCapacityLock(this.prisma, async (tx) => {
      const [request] = await tx.$queryRaw<MentorParticipationRequest[]>`
        UPDATE mentor_participation_requests SET status = 'CANCELLED'
        WHERE user_id = ${userId}::uuid AND status = 'PENDING' RETURNING ${fields}`;
      if (!request) return { result: 'NOT_FOUND' as const };
      return { result: 'CANCELLED' as const, request };
    });
  }
}
