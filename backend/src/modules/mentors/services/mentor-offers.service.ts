import { isEligibleMentor } from './mentor-eligibility.service.js';
import { MentorOfferStatusCode } from '../types/mentor-offer-status.enum.js';
import { MentorRequestStatusCode } from '../types/mentor-request-status.enum.js';
import { Injectable } from '@nestjs/common';
import { MentorOffersRepository } from '../repositories/mentor-offers.repository.js';
import { MentorOfferException } from '../exceptions/mentor-offer.exception.js';
import {
  AlreadyMentorException,
  InvalidOrientationTypesException,
  InvalidTechnicalAreasException,
  MentorEligibilityException,
  MentorRoleNotFoundException,
} from '../exceptions/index.js';
import type { MentorOfferConfirmation } from '../types/mentor-offer-confirmation.types.js';
import { reconcileMentorOffers } from './mentor-offer-allocation.service.js';

@Injectable()
export class MentorOffersService {
  constructor(private readonly repository: MentorOffersRepository) {}

  reconcile() {
    return this.repository.withLock((tx) =>
      reconcileMentorOffers(this.repository, tx),
    );
  }

  async confirm(userId: string, offerId: string) {
    const result = await this.repository.withLock(
      async (tx): Promise<MentorOfferConfirmation> => {
        await reconcileMentorOffers(this.repository, tx);
        const offer = await this.repository.findForUpdate(tx, userId, offerId);
        if (!offer) throw new MentorOfferException('Oferta no encontrada', 404);
        if (
          offer.status === MentorOfferStatusCode.CONFIRMED &&
          offer.requestStatus === MentorRequestStatusCode.ACTIVE
        )
          return {
            id: userId,
            status: MentorRequestStatusCode.ACTIVE,
            alreadyConfirmed: true,
          };
        if (
          offer.status !== MentorOfferStatusCode.OFFERED ||
          offer.requestStatus !== MentorRequestStatusCode.OFFERED
        )
          return { expired: true };
        const eligibility = await this.repository.admissionFacts(userId, tx);
        if (!isEligibleMentor(eligibility))
          throw new MentorEligibilityException();
        if (eligibility.alreadyMentor) throw new AlreadyMentorException();
        const { areas, orientations } = await this.repository.preferenceCounts(
          tx,
          offer.technicalAreaIds,
          offer.orientationTypeIds,
        );
        if (!areas || areas !== offer.technicalAreaIds.length)
          throw new InvalidTechnicalAreasException();
        if (!orientations || orientations !== offer.orientationTypeIds.length)
          throw new InvalidOrientationTypesException();
        const role = await this.repository.role(tx);
        if (!role) throw new MentorRoleNotFoundException();
        if (!(await this.repository.claim(tx, offerId))) {
          await reconcileMentorOffers(this.repository, tx);
          return { expired: true };
        }
        await this.repository.assign(tx, userId, role.id, offer);
        return {
          id: userId,
          status: MentorRequestStatusCode.ACTIVE,
          alreadyConfirmed: false,
        };
      },
    );
    if ('expired' in result)
      throw new MentorOfferException(
        'La oferta no está vigente. Registra una solicitud nueva',
      );
    return result;
  }
}
