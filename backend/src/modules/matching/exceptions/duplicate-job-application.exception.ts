import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { JOB_APPLICATION_MESSAGES } from '../constants/job-application.constants.js';

export class DuplicateJobApplicationException extends DomainException {
  constructor() {
    super(JOB_APPLICATION_MESSAGES.DUPLICATE, 409, 'DUPLICATE_JOB_APPLICATION');
  }
}
