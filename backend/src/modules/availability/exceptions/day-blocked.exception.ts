import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { AVAILABILITY_ERROR_CODES } from '../constants/availability-error-codes.constants.js';

export class DayBlockedException extends DomainException {
  constructor(message = 'Ese día está bloqueado') {
    super(message, 409, AVAILABILITY_ERROR_CODES.dayBlocked);
  }
}
