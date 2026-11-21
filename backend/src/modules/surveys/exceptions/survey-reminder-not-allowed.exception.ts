import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { SURVEY_REMINDER_ERROR_MESSAGES } from '../constants/survey-participation.constants.js';

export class SurveyReminderNotAllowedException extends DomainException {
  constructor() {
    super(
      SURVEY_REMINDER_ERROR_MESSAGES.NOT_ALLOWED,
      409,
      'SURVEY_REMINDER_NOT_ALLOWED',
    );
  }
}
