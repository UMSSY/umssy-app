import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class RadarReviewInvalidDecisionException extends DomainException {
  constructor() {
    super('Decisión inválida', 400, 'RADAR_REVIEW_INVALID_DECISION');
  }
}
