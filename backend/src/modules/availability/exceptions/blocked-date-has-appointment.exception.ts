import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { AVAILABILITY_ERROR_CODES } from '../constants/availability-error-codes.constants.js';

export class BlockedDateHasAppointmentException extends DomainException {
  constructor(message = 'No puedes bloquear un día con citas confirmadas') {
    super(message, 409, AVAILABILITY_ERROR_CODES.blockedDateHasAppointment);
  }
}
