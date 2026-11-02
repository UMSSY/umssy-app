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
    const result = await this.repository.confirm(userId, offerId);
    if ('expired' in result) throw new MentorOfferException('La oferta no está vigente. Registra una solicitud nueva');
    return result;
  }
}
