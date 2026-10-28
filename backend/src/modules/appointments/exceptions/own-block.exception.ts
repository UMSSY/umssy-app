import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { APPOINTMENT_ERROR_CODES } from '../constants/appointment-error-codes.constants.js';

export class OwnBlockException extends DomainException {
  constructor(message = 'No puedes reservar tu propio horario') {
    super(message, 403, APPOINTMENT_ERROR_CODES.ownBlock);
  }
}
