import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { APPOINTMENT_ERROR_CODES } from '../constants/appointment-error-codes.constants.js';

export class AppointmentDocumentUploadForbiddenException extends DomainException {
  constructor() {
    super(
      'Solo quien reservó la cita puede adjuntar un documento',
      403,
      APPOINTMENT_ERROR_CODES.appointmentDocumentUploadForbidden,
    );
  }
}
