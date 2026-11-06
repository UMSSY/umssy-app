import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { SURVEY_ERROR_MESSAGES } from '../constants/survey.constants.js';

export class SurveyNotAvailableException extends DomainException {
  constructor() {
    super(SURVEY_ERROR_MESSAGES.SURVEY_NOT_AVAILABLE, 403, 'SURVEY_NOT_AVAILABLE', { field: 'surveyId' });
  }
}
