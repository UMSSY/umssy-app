import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class RadarReviewNotFoundException extends DomainException {
  constructor(message = 'Evidencia no encontrada') {
    super(message, 404, 'RADAR_REVIEW_NOT_FOUND');
  }
}
