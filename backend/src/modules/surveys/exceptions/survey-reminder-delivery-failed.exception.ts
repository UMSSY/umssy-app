import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { SURVEY_REMINDER_ERROR_MESSAGES } from '../constants/survey-participation.constants.js';

export class SurveyReminderDeliveryFailedException extends DomainException {
  constructor() {
    super(
      SURVEY_REMINDER_ERROR_MESSAGES.DELIVERY_FAILED,
      502,
      'SURVEY_REMINDER_DELIVERY_FAILED',
    );
  }
}
