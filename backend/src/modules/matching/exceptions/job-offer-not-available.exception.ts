import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { JOB_OFFER_NOT_AVAILABLE_MESSAGE } from '../constants/job-match.constants.js';

export class JobOfferNotAvailableException extends DomainException {
  constructor() {
    super(JOB_OFFER_NOT_AVAILABLE_MESSAGE, 404, 'JOB_OFFER_NOT_AVAILABLE');
  }
}
