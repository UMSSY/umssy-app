import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { APPOINTMENT_ERROR_CODES } from '../constants/appointment-error-codes.constants.js';

export class BlockAlreadyBookedException extends DomainException {
  constructor(message = 'Este horario ya fue reservado') {
    super(message, 409, APPOINTMENT_ERROR_CODES.blockAlreadyBooked);
  }
}
