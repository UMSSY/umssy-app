import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { JOB_APPLICATION_MESSAGES } from '../constants/job-application.constants.js';

export class JobApplicationNotFoundException extends DomainException {
  constructor() {
    super(JOB_APPLICATION_MESSAGES.APPLICATION_NOT_FOUND, 404, 'JOB_APPLICATION_NOT_FOUND');
  }
}
