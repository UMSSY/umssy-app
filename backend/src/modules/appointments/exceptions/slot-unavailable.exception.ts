import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { APPOINTMENT_ERROR_CODES } from '../constants/appointment-error-codes.constants.js';

export class SlotUnavailableException extends DomainException {
  constructor(message = 'Este horario ya no está disponible') {
    super(message, 409, APPOINTMENT_ERROR_CODES.slotUnavailable);
  }
}
