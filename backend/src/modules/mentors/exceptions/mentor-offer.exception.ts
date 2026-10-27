import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class MentorOfferException extends DomainException {
  constructor(message: string, statusCode = 409) {
    super(message, statusCode, 'MENTOR_OFFER_ERROR');
  }
}
