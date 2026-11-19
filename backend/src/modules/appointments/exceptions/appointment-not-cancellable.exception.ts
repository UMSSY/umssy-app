import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { APPOINTMENT_ERROR_CODES } from '../constants/appointment-error-codes.constants.js';

export class AppointmentNotCancellableException extends DomainException {
  constructor() {
    super(
      'Solo se puede cancelar una cita confirmada que aún no empezó',
      409,
      APPOINTMENT_ERROR_CODES.appointmentNotCancellable,
    );
  }
}
