import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class JobOfferExpiryInPastException extends DomainException {
  constructor() {
    super(
      'La fecha de cierre debe ser posterior al momento actual.',
      422,
      'JOB_OFFER_EXPIRY_IN_PAST',
    );
  }
}