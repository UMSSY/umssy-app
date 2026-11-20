import type { MentorOfferConfirmation } from '../types/mentor-offer.types.js';
import {
  AlreadyMentorException,
  MentorEligibilityException,
  MentorRoleNotFoundException,
  InvalidTechnicalAreasException,
  InvalidOrientationTypesException,
} from '../exceptions/index.js';
import { Injectable } from '@nestjs/common';
import { MentorOffersRepository } from '../repositories/mentor-offers.repository.js';
import { MentorOfferException } from '../exceptions/mentor-offer.exception.js';

@Injectable()
export class MentorOffersService {
  constructor(private readonly repository: MentorOffersRepository) {}

  reconcile() {
    return this.repository.reconcile();
  }

  async confirm(userId: string, offerId: string) {
    const result = await this.repository.withLock(
      async (tx): Promise<MentorOfferConfirmation> => {
        await this.repository.reconcile(tx);
        const offer = await this.repository.findLockedOffer(
          userId,
          offerId,
          tx,
        );
        if (!offer) throw new MentorOfferException('Oferta no encontrada', 404);
        if (offer.status === 'CONFIRMED' && offer.requestStatus === 'ACTIVE')
          return { id: userId, status: 'ACTIVE', alreadyConfirmed: true };
        if (offer.status !== 'OFFERED' || offer.requestStatus !== 'OFFERED')
          return { expired: true };
        const eligibility = await this.repository.eligibility(userId, tx);
        if (!eligibility.eligible) throw new MentorEligibilityException();
        if (eligibility.alreadyMentor) throw new AlreadyMentorException();
        const areas = await this.repository.countAreas(
          offer.technicalAreaIds,
          tx,
        );
        const orientations = await this.repository.countOrientations(
          offer.orientationTypeIds,
          tx,
        );
        if (!areas || areas !== offer.technicalAreaIds.length)
          throw new InvalidTechnicalAreasException();
        if (!orientations || orientations !== offer.orientationTypeIds.length)
          throw new InvalidOrientationTypesException();
        const role = await this.repository.findRole(tx);
        if (!role) throw new MentorRoleNotFoundException();
        if (!(await this.repository.claim(offerId, tx))) {
          await this.repository.reconcile(tx);
          return { expired: true };
        }
        await this.repository.activateOffer(userId, role, offer, tx);
        return { id: userId, status: 'ACTIVE', alreadyConfirmed: false };
      },
    );
    if ('expired' in result)
      throw new MentorOfferException(
        'La oferta no está vigente. Registra una solicitud nueva',
      );
    return result;
  }
}
