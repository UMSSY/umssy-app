import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { AlreadyMentorException, InvalidOrientationTypesException, InvalidTechnicalAreasException,
  MentorEligibilityException, MentorRoleNotFoundException } from '../exceptions/index.js';
import { MentorOfferException } from '../exceptions/mentor-offer.exception.js';
import type { MentorOfferConfirmation, MentorOfferRecord } from '../types/mentor-offer.types.js';
import { withMentorCapacityLock } from './mentor-capacity-lock.js';
import { readMentorEligibility } from './mentor-capacity.queries.js';
import { reconcileMentorOffers } from './mentor-offers.queries.js';

@Injectable()
export class MentorOffersRepository {
  constructor(private readonly prisma: PrismaService) {}

  reconcile() {
    return withMentorCapacityLock(this.prisma, reconcileMentorOffers);
  }

  confirm(userId: string, offerId: string): Promise<MentorOfferConfirmation> {
    return withMentorCapacityLock(this.prisma, async (tx): Promise<MentorOfferConfirmation> => {
      // El vencimiento se confirma aunque luego se rechace una oferta ya expirada.
      await reconcileMentorOffers(tx);
      const [offer] = await tx.$queryRaw<MentorOfferRecord[]>`
        SELECT o.request_id AS "requestId", o.status, r.status AS "requestStatus",
          r.technical_area_ids AS "technicalAreaIds", r.orientation_type_ids AS "orientationTypeIds"
        FROM mentor_slot_offers o JOIN mentor_participation_requests r ON r.id = o.request_id
        WHERE o.id = ${offerId}::uuid AND o.user_id = ${userId}::uuid AND r.user_id = ${userId}::uuid
        FOR UPDATE OF o, r
      `;
      if (!offer) throw new MentorOfferException('Oferta no encontrada', 404);
      if (offer.status === 'CONFIRMED' && offer.requestStatus === 'ACTIVE') {
        return { id: userId, status: 'ACTIVE', alreadyConfirmed: true };
      }
      if (offer.status !== 'OFFERED' || offer.requestStatus !== 'OFFERED') return { expired: true };
      const eligibility = await readMentorEligibility(tx, userId);
      if (!eligibility.eligible) throw new MentorEligibilityException();
      if (eligibility.alreadyMentor) throw new AlreadyMentorException();
      const areas = await tx.technicalArea.count({ where: { id: { in: offer.technicalAreaIds } } });
      const orientations = await tx.orientationType.count({ where: { id: { in: offer.orientationTypeIds }, isActive: true } });
      if (!areas || areas !== offer.technicalAreaIds.length) throw new InvalidTechnicalAreasException();
      if (!orientations || orientations !== offer.orientationTypeIds.length) throw new InvalidOrientationTypesException();
      const role = await tx.role.findUnique({ where: { name: 'mentor' }, select: { id: true } });
      if (!role) throw new MentorRoleNotFoundException();
      const claimed = await tx.$executeRaw`
        UPDATE mentor_slot_offers SET status = 'CONFIRMED', confirmed_at = clock_timestamp()
        WHERE id = ${offerId}::uuid AND status = 'OFFERED' AND expires_at > clock_timestamp()
      `;
      if (!claimed) {
        await reconcileMentorOffers(tx);
        return { expired: true };
      }
      await tx.userRole.create({ data: { userId, roleId: role.id } });
      await tx.mentorTechnicalArea.deleteMany({ where: { mentorId: userId } });
      await tx.mentorOrientationType.deleteMany({ where: { mentorId: userId } });
      await tx.mentorTechnicalArea.createMany({ data: offer.technicalAreaIds.map((technicalAreaId) => ({ mentorId: userId, technicalAreaId })) });
      await tx.mentorOrientationType.createMany({ data: offer.orientationTypeIds.map((orientationTypeId) => ({ mentorId: userId, orientationTypeId })) });
      await tx.user.update({ where: { id: userId }, data: { isAvailableForMentoring: true } });
      await tx.$executeRaw`UPDATE mentor_participation_requests SET status = 'ACTIVE' WHERE id = ${offer.requestId}::uuid`;
      return { id: userId, status: 'ACTIVE', alreadyConfirmed: false };
    });
  }
}
