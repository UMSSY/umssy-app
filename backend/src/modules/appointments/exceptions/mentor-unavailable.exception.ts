import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { APPOINTMENT_ERROR_CODES } from '../constants/appointment-error-codes.constants.js';

export class MentorUnavailableException extends DomainException {
  constructor(message = 'El mentor no está disponible para recibir citas') {
    super(message, 403, APPOINTMENT_ERROR_CODES.mentorUnavailable);
  }
}
