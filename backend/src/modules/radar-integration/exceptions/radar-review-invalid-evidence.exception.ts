import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class RadarReviewInvalidEvidenceException extends DomainException {
  constructor() {
    super(
      'Tipo de evidencia desconocido',
      400,
      'RADAR_REVIEW_INVALID_EVIDENCE',
    );
  }
}
