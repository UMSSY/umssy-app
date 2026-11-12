import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { APPOINTMENT_ERROR_CODES } from '../constants/appointment-error-codes.constants.js';

export class DailyAppointmentLimitException extends DomainException {
  constructor(
    message = 'Ya tienes una cita reservada ese día. Elige otro día.',
  ) {
    super(message, 409, APPOINTMENT_ERROR_CODES.dailyAppointmentLimit);
  }
}
