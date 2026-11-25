import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class JobOfferNotClosableException extends DomainException {
  constructor() {
    super(
      'Solo se pueden cerrar vacantes publicadas.',
      409,
      'JOB_OFFER_NOT_CLOSABLE',
    );
  }
}