import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { APPOINTMENT_ERROR_CODES } from '../constants/appointment-error-codes.constants.js';

export class AppointmentNotFoundException extends DomainException {
  constructor() {
    super('La cita no existe', 404, APPOINTMENT_ERROR_CODES.appointmentNotFound);
  }
}
