import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { SURVEY_ERROR_MESSAGES } from '../constants/survey.constants.js';

export class SurveyHasResponsesException extends DomainException {
  constructor() {
    super(SURVEY_ERROR_MESSAGES.SURVEY_HAS_RESPONSES, 409, 'SURVEY_HAS_RESPONSES', { field: 'status' });
  }
}
