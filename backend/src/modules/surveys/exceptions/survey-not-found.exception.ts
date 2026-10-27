import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { SURVEY_ERROR_MESSAGES } from '../constants/survey.constants.js';

export class SurveyNotFoundException extends DomainException {
  constructor() {
    super(SURVEY_ERROR_MESSAGES.SURVEY_NOT_FOUND, 404, 'SURVEY_NOT_FOUND', { field: 'id' });
  }
}
