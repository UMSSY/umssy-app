import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { JOB_APPLICATION_MESSAGES } from '../constants/job-application.constants.js';

export class JobApplicationStatusMissingException extends DomainException {
  constructor() {
    super(JOB_APPLICATION_MESSAGES.STATUS_MISSING, 500);
  }
}
