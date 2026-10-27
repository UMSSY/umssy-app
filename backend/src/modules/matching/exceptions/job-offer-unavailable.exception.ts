import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { JOB_APPLICATION_MESSAGES } from '../constants/job-application.constants.js';

export class JobOfferUnavailableException extends DomainException {
  constructor() {
    super(JOB_APPLICATION_MESSAGES.OFFER_UNAVAILABLE, 404, 'JOB_OFFER_UNAVAILABLE');
  }
}
