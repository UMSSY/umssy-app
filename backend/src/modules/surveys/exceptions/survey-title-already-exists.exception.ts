import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { SURVEY_ERROR_MESSAGES } from '../constants/survey.constants.js';

export class SurveyTitleAlreadyExistsException extends DomainException {
  constructor() {
    super(SURVEY_ERROR_MESSAGES.TITLE_ALREADY_EXISTS, 409, { field: 'title' });
  }
}
