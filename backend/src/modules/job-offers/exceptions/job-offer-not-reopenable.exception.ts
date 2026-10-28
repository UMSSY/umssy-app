import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class JobOfferNotReopenableException extends DomainException {
  constructor() {
    super('Solo se pueden reabrir vacantes cerradas.', 409, 'JOB_OFFER_NOT_REOPENABLE');
  }
}
