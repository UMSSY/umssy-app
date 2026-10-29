import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { JOB_APPLICATION_MESSAGES } from '../constants/job-application.constants.js';

export class JobApplicationNotWithdrawableException extends DomainException {
  constructor() {
    super(JOB_APPLICATION_MESSAGES.NOT_WITHDRAWABLE, 409, 'JOB_APPLICATION_NOT_WITHDRAWABLE');
  }
}
