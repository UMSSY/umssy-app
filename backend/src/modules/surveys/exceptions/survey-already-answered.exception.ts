import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class SurveyAlreadyAnsweredException extends DomainException {
  constructor() {
    super('Ya has respondido a esta encuesta', 409, 'SURVEY_ALREADY_ANSWERED', { field: 'surveyId' });
  }
}
