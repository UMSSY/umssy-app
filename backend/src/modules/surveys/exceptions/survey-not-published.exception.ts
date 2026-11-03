import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { SURVEY_ERROR_MESSAGES } from '../constants/survey.constants.js';

export class SurveyNotPublishedException extends DomainException {
  constructor() {
    super(SURVEY_ERROR_MESSAGES.SURVEY_NOT_PUBLISHED, 409, 'SURVEY_NOT_PUBLISHED', { field: 'status' });
  }
}
