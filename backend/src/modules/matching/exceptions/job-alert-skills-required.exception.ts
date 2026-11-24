import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { JOB_ALERT_SKILLS_REQUIRED_MESSAGE } from '../constants/job-alert-preference.constants.js';

export class JobAlertSkillsRequiredException extends DomainException {
  constructor() {
    super(JOB_ALERT_SKILLS_REQUIRED_MESSAGE, 422, 'JOB_ALERT_SKILLS_REQUIRED');
  }
}
