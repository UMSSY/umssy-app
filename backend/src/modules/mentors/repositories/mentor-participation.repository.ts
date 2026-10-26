
import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../prisma/client.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { withMentorCapacityLock } from './mentor-capacity-lock.js';
import {
  readMentorCapacity,
  readMentorEligibility,
} from './mentor-capacity.queries.js';

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

      const existingRequest =
        await tx.mentorParticipationRequest.findFirst({
          where: {
            userId,
            status: { in: ['PENDING', 'OFFERED'] },
          },
          orderBy: [
            { queuedAt: 'asc' },
            { id: 'asc' },
          ],
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
    return this.prisma.mentorParticipationRequest.findFirst({
      where: {
        userId,
        status: {
          in: ['PENDING', 'OFFERED', 'ACTIVE'],
        },
      },
      orderBy: [
        { queuedAt: 'desc' },
        { id: 'desc' },
      ],
    });
  }

  // Consulta el historial completo sin modificar los estados ni la cola FIFO.
  findMyHistory(userId: string) {
    return this.prisma.mentorParticipationRequest.findMany({
      where: {
        userId,
      },
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
          where: {
            id: request.id,
          },
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
          where: {
            id: request.id,
          },
          data: {
            status: 'CANCELLED',
          },
        });

      return {
        result: 'CANCELLED' as const,
        request: cancelled,
      };
    });
  }
}
