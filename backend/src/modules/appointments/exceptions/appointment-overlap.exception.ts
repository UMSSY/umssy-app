import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { APPOINTMENT_ERROR_CODES } from '../constants/appointment-error-codes.constants.js';

export class AppointmentOverlapException extends DomainException {
  constructor(
    message = 'Ya tienes una cita en ese horario. Elige otro horario.',
  ) {
    super(message, 409, APPOINTMENT_ERROR_CODES.appointmentOverlap);
  }
}
