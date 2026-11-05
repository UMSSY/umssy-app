import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { APPOINTMENT_ERROR_CODES } from '../constants/appointment-error-codes.constants.js';

export class AppointmentDocumentNotFoundException extends DomainException {
  constructor() {
    super(
      'La cita no tiene un documento adjunto',
      404,
      APPOINTMENT_ERROR_CODES.appointmentDocumentNotFound,
    );
  }
}
