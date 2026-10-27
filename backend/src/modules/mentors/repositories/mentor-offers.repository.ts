import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MentorTransactionRepository } from './mentor-transaction.repository.js';
import { assignMentorParticipation } from './mentor-assignment.queries.js';
import type { MentorTransaction } from '../types/mentor-transaction.types.js';
import type { MentorOfferRecord } from '../types/mentor-offer-record.types.js';

@Injectable()
export class MentorOffersRepository extends MentorTransactionRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findForUpdate(tx: MentorTransaction, userId: string, offerId: string) {
    const [offer] = await tx.$queryRaw<MentorOfferRecord[]>`
      SELECT o.request_id AS "requestId", mentor_offer_status_title(o.status_id) AS status, mentor_request_status_title(r.status_id) AS "requestStatus",
        r.technical_area_ids AS "technicalAreaIds", r.orientation_type_ids AS "orientationTypeIds"
      FROM mentor_slot_offers o JOIN mentor_participation_requests r ON r.id = o.request_id
      WHERE o.id = ${offerId}::uuid AND o.user_id = ${userId}::uuid AND r.user_id = ${userId}::uuid
      FOR UPDATE OF o, r`;
    return offer;
  }

  claim(tx: MentorTransaction, offerId: string) {
    return tx.$executeRaw`
      UPDATE mentor_slot_offers SET status_id = mentor_offer_status('CONFIRMED'), confirmed_at = clock_timestamp()
      WHERE id = ${offerId}::uuid AND status_id = mentor_offer_status('OFFERED') AND expires_at > clock_timestamp()`;
  }

  async assign(
    tx: MentorTransaction,
    userId: string,
    roleId: string,
    offer: MentorOfferRecord,
  ) {
    await assignMentorParticipation(
      tx,
      userId,
      roleId,
      offer.technicalAreaIds,
      offer.orientationTypeIds,
    );
    await tx.$executeRaw`UPDATE mentor_participation_requests SET status_id = mentor_request_status('ACTIVE') WHERE id = ${offer.requestId}::uuid`;
  }
}
