
import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../prisma/client.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { withMentorCapacityLock } from './mentor-capacity-lock.js';
import { reconcileMentorOffers } from './mentor-offers.queries.js';
import {
  readMentorCapacity,
  readMentorEligibility,
} from './mentor-capacity.queries.js';

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
  ): Promise<boolean> {
    if (!technicalAreaIds.length || !orientationTypeIds.length) {
      return false;
    }

    const [areas, orientations] = await Promise.all([
      tx.technicalArea.count({
        where: {
          id: { in: technicalAreaIds },
        },
      }),
      tx.orientationType.count({
        where: {
          id: { in: orientationTypeIds },
          isActive: true,
        },
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

      if (!eligibility.eligible || eligibility.alreadyMentor) {
        return { result: 'NOT_ELIGIBLE' as const };
      }

      const attempt = await this.registerAttempt(tx, userId);

      if (attempt.result === 'SANCTIONED') {
        return attempt;
      }

      await reconcileMentorOffers(tx);

      const existingRequest =
        await tx.mentorParticipationRequest.findFirst({
          where: {
            userId,
            status: { in: ['PENDING', 'OFFERED'] },
          },
          orderBy: [{ queuedAt: 'asc' }, { id: 'asc' }],
        });

      if (existingRequest) {
        return {
          result: 'ALREADY_EXISTS' as const,
          request: existingRequest,
        };
      }

      const valid = await this.validatePreferences(
        tx,
        technicalAreaIds,
        orientationTypeIds,
      );

      if (!valid) {
        return {
          result: 'INVALID_PREFERENCES' as const,
        };
      }

      const capacity = await readMentorCapacity(tx);

      if (capacity.available > 0) {
        return {
          result: 'CAPACITY_AVAILABLE' as const,
        };
      }

      const request = await tx.mentorParticipationRequest.create({
        data: {
          userId,
          status: 'PENDING',
          technicalAreaIds,
          orientationTypeIds,
        },
      });

      return {
        result: 'CREATED' as const,
        request,
      };
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
    return this.prisma.mentorParticipationRequest.findMany({
      where: { userId },
      orderBy: [
        { queuedAt: 'desc' },
        { id: 'desc' },
      ],
    });
  }

  updatePreferences(
    userId: string,
    technicalAreaIds: string[],
    orientationTypeIds: string[],
  ) {
    return withMentorCapacityLock(this.prisma, async (tx) => {
      const request =
        await tx.mentorParticipationRequest.findFirst({
          where: {
            userId,
            status: 'PENDING',
          },
          orderBy: [
            { queuedAt: 'asc' },
            { id: 'asc' },
          ],
        });

      if (!request) {
        return {
          result: 'NOT_FOUND' as const,
        };
      }

      const valid = await this.validatePreferences(
        tx,
        technicalAreaIds,
        orientationTypeIds,
      );

      if (!valid) {
        return {
          result: 'INVALID_PREFERENCES' as const,
        };
      }

      const updated =
        await tx.mentorParticipationRequest.update({
          where: { id: request.id },
          data: {
            technicalAreaIds,
            orientationTypeIds,
          },
        });

      return {
        result: 'UPDATED' as const,
        request: updated,
      };
    });
  }

  cancelRequest(userId: string) {
    return withMentorCapacityLock(this.prisma, async (tx) => {
      const request =
        await tx.mentorParticipationRequest.findFirst({
          where: {
            userId,
            status: 'PENDING',
          },
          orderBy: [
            { queuedAt: 'asc' },
            { id: 'asc' },
          ],
        });

      if (!request) {
        return {
          result: 'NOT_FOUND' as const,
        };
      }

      const cancelled =
        await tx.mentorParticipationRequest.update({
          where: { id: request.id },
          data: { status: 'CANCELLED' },
        });

      return {
        result: 'CANCELLED' as const,
        request: cancelled,
      };
    });
  }
}
