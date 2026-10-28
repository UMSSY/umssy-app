import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { APPOINTMENT_ERROR_CODES } from '../constants/appointment-error-codes.constants.js';

export class AppointmentNotOwnedException extends DomainException {
  constructor() {
    super('No tienes acceso a esta cita', 403, APPOINTMENT_ERROR_CODES.appointmentNotOwned);
  }
}
