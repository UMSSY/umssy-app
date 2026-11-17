import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class RadarReviewOperationConflictException extends DomainException {
  constructor() {
    super(
      'El identificador de operacion ya fue utilizado con otros datos',
      409,
      'RADAR_REVIEW_OPERATION_CONFLICT',
    );
  }
}
