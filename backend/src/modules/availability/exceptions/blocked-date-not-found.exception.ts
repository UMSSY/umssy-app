import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { AVAILABILITY_ERROR_CODES } from '../constants/availability-error-codes.constants.js';

export class BlockedDateNotFoundException extends DomainException {
  constructor(message = 'La fecha bloqueada no existe') {
    super(message, 404, AVAILABILITY_ERROR_CODES.blockedDateNotFound);
  }
}
