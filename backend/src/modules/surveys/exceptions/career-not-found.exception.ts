import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { SURVEY_ERROR_MESSAGES } from '../constants/survey.constants.js';

export class CareerNotFoundException extends DomainException {
  constructor() {
    super(SURVEY_ERROR_MESSAGES.CAREER_NOT_FOUND, 404, { field: 'careerId' });
  }
}
