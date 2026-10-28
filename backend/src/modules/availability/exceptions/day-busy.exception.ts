import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { AVAILABILITY_ERROR_CODES } from '../constants/availability-error-codes.constants.js';

export class DayBusyException extends DomainException {
  constructor(message = 'Hay otra operación en curso para ese día. Intenta de nuevo.') {
    super(message, 409, AVAILABILITY_ERROR_CODES.dayBusy);
  }
}
