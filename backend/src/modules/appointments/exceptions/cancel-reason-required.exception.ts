import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { APPOINTMENT_ERROR_CODES } from '../constants/appointment-error-codes.constants.js';

export class CancelReasonRequiredException extends DomainException {
  constructor() {
    super(
      'Indica el motivo de la cancelación',
      400,
      APPOINTMENT_ERROR_CODES.cancelReasonRequired,
    );
  }
}
