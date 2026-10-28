import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class SurveyExpiredException extends DomainException {
  constructor() {
    super('La encuesta ha caducado y no acepta más respuestas', 400, 'SURVEY_EXPIRED', { field: 'surveyId' });
  }
}
