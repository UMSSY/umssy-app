import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class JobOfferNotReopenableException extends DomainException {
  constructor(message = 'La vacante no se puede reabrir en su estado actual.') {
    super(message, 409);
  }
}