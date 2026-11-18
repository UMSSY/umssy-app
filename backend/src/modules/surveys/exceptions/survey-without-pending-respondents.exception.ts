import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { SURVEY_REMINDER_ERROR_MESSAGES } from '../constants/survey-participation.constants.js';

export class SurveyWithoutPendingRespondentsException extends DomainException {
  constructor() {
    super(
      SURVEY_REMINDER_ERROR_MESSAGES.NO_PENDING_RESPONDENTS,
      409,
      'SURVEY_WITHOUT_PENDING_RESPONDENTS',
    );
  }
}
