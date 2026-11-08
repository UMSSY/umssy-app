import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Prisma } from '../../../prisma/client.js';
import type { MentorOfferRecord } from '../types/mentor-offer.types.js';
import { withMentorCapacityLock } from './mentor-capacity-lock.js';
import { readMentorEligibility } from './mentor-capacity.queries.js';
import { reconcileMentorOffers } from './mentor-offers.queries.js';

@Injectable()
export class MentorOffersRepository {
  constructor(private readonly prisma: PrismaService) {}
  withLock<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>) {
    return withMentorCapacityLock(this.prisma, operation);
  }
  reconcile(tx?: Prisma.TransactionClient) {
    return tx
      ? reconcileMentorOffers(tx)
      : withMentorCapacityLock(this.prisma, reconcileMentorOffers);
  }
  async findLockedOffer(
    userId: string,
    offerId: string,
    tx: Prisma.TransactionClient,
  ) {
    const [offer] = await tx.$queryRaw<MentorOfferRecord[]>`
        SELECT o.request_id AS "requestId", o.status, r.status AS "requestStatus",
          r.technical_area_ids AS "technicalAreaIds", r.orientation_type_ids AS "orientationTypeIds"
        FROM mentor_slot_offers o JOIN mentor_participation_requests r ON r.id = o.request_id
        WHERE o.id = ${offerId}::uuid AND o.user_id = ${userId}::uuid AND r.user_id = ${userId}::uuid
        FOR UPDATE OF o, r
      `;
    return offer;
  }
  eligibility(userId: string, tx: Prisma.TransactionClient) {
    return readMentorEligibility(tx, userId);
  }
  countAreas(ids: string[], tx: Prisma.TransactionClient) {
    return tx.technicalArea.count({ where: { id: { in: ids } } });
  }
  countOrientations(ids: string[], tx: Prisma.TransactionClient) {
    return tx.orientationType.count({
      where: { id: { in: ids }, isActive: true },
    });
  }
  findRole(tx: Prisma.TransactionClient) {
    return tx.role.findUnique({
      where: { name: 'mentor' },
      select: { id: true },
    });
  }
  async claim(offerId: string, tx: Prisma.TransactionClient) {
    return await tx.$executeRaw`
        UPDATE mentor_slot_offers SET status = 'CONFIRMED', confirmed_at = clock_timestamp()
        WHERE id = ${offerId}::uuid AND status = 'OFFERED' AND expires_at > clock_timestamp()
      `;
  }
  async activateOffer(
    userId: string,
    role: { id: string },
    offer: MentorOfferRecord,
    tx: Prisma.TransactionClient,
  ) {
    await tx.userRole.create({ data: { userId, roleId: role.id } });
    await tx.mentorTechnicalArea.deleteMany({ where: { mentorId: userId } });
    await tx.mentorOrientationType.deleteMany({ where: { mentorId: userId } });
    await tx.mentorTechnicalArea.createMany({
      data: offer.technicalAreaIds.map((technicalAreaId) => ({
        mentorId: userId,
        technicalAreaId,
      })),
    });
    await tx.mentorOrientationType.createMany({
      data: offer.orientationTypeIds.map((orientationTypeId) => ({
        mentorId: userId,
        orientationTypeId,
      })),
    });
    await tx.user.update({
      where: { id: userId },
      data: { isAvailableForMentoring: true },
    });
    if (offer.requestId) {
      await tx.mentorParticipationRequest.updateMany({
        where: { id: offer.requestId },
        data: { status: 'ACTIVE' },
      });
    }
  }
}
