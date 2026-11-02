import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { SURVEY_ERROR_MESSAGES } from '../constants/survey.constants.js';

export class SurveysStorageUnavailableException extends DomainException {
  constructor() {
    super(SURVEY_ERROR_MESSAGES.STORAGE_UNAVAILABLE, 503, 'SURVEYS_STORAGE_UNAVAILABLE');
  }
}
