import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { AVAILABILITY_ERROR_CODES } from '../constants/availability-error-codes.constants.js';

export class BlockedDateNotOwnedException extends DomainException {
  constructor(message = 'La fecha bloqueada no pertenece al usuario') {
    super(message, 403, AVAILABILITY_ERROR_CODES.blockedDateNotOwned);
  }
}
