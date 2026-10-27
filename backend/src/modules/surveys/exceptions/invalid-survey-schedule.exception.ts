import { DomainException } from '../../../common/exceptions/domain.exception.js';
import type { SurveyScheduleError } from '../types/survey-schedule-error.type.js';

export class InvalidSurveyScheduleException extends DomainException {
  constructor({ field, message }: SurveyScheduleError) {
    super(message, 400, 'INVALID_SURVEY_SCHEDULE', { field });
  }
}
