import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { APPOINTMENT_ERROR_CODES } from '../constants/appointment-error-codes.constants.js';

export class AppointmentClosedException extends DomainException {
  constructor() {
    super(
      'Solo puedes adjuntar un documento a una cita confirmada que aún no terminó',
      409,
      APPOINTMENT_ERROR_CODES.appointmentClosed,
    );
  }
}
