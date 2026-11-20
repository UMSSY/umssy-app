
import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../prisma/client.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { withMentorCapacityLock } from './mentor-capacity-lock.js';
import {
  readMentorCapacity,
  readMentorEligibility,
} from './mentor-capacity.queries.js';
import { reconcileMentorOffers } from './mentor-offers.queries.js';
import { MentorIntakeRepository } from './mentor-intake.repository.js';

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

@Injectable()
export class MentorParticipationRepository extends MentorIntakeRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

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

  createRequest(
    userId: string,
    technicalAreaIds: string[],
    orientationTypeIds: string[],
    transaction?: Prisma.TransactionClient,
  ) {
    const create = async (tx: Prisma.TransactionClient) => {
      const eligibility = await readMentorEligibility(tx, userId);

      if (!eligibility.eligible || eligibility.alreadyMentor)
        return { result: 'NOT_ELIGIBLE' as const };

      await reconcileMentorOffers(tx);

      const existing = await tx.mentorParticipationRequest.findFirst({
        where: { userId, status: { in: ['PENDING', 'OFFERED'] } },
        orderBy: [{ queuedAt: 'asc' }, { id: 'asc' }],
      });

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
    };

    return transaction
      ? create(transaction)
      : withMentorCapacityLock(this.prisma, create);
  }

  findMyRequest(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.mentorParticipationRequest.findFirst({
        where: { userId },
        orderBy: [{ queuedAt: 'desc' }, { id: 'desc' }],
        include: {
          offer: true,
          user: { select: { email: true } },
        },
      });

      if (!request) return null;

      if (!['PENDING', 'OFFERED', 'ACTIVE'].includes(request.status)) {
        const { alreadyMentor } = await readMentorEligibility(tx, userId);
        if (alreadyMentor) return null;
      }

      const { user, ...details } = request;

      return { ...details, email: user.email };
    });
  }

  findMyHistory(userId: string) {
    return this.prisma.mentorParticipationRequest.findMany({
      where: { userId },
      orderBy: [{ queuedAt: 'desc' }, { id: 'desc' }],
    });
  }

  async findMyHistoryPaginated(
    userId: string,
    page: number,
    limit: number,
  ) {
    const where = { userId };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.mentorParticipationRequest.findMany({
        where,
        orderBy: [{ queuedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.mentorParticipationRequest.count({
        where,
      }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
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

      const request = await tx.mentorParticipationRequest.update({
        where: { id: pending.id },
        data: { technicalAreaIds, orientationTypeIds },
      });

      return { result: 'UPDATED' as const, request };
    });
  }

  cancelRequest(userId: string) {
    return withMentorCapacityLock(this.prisma, async (tx) => {
      const [request] =
        await tx.mentorParticipationRequest.updateManyAndReturn({
          where: { userId, status: 'PENDING' },
          data: { status: 'CANCELLED' },
        });

      if (!request) return { result: 'NOT_FOUND' as const };

      return { result: 'CANCELLED' as const, request };
    });
  }
}
