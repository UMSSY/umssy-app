import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { AVAILABILITY_ERROR_CODES } from '../constants/availability-error-codes.constants.js';

export class BlockedDateInPastException extends DomainException {
  constructor(message = 'No se pueden bloquear fechas pasadas') {
    super(message, 400, AVAILABILITY_ERROR_CODES.blockedDateInPast);
  }
}
