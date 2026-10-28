import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { APPOINTMENT_ERROR_CODES } from '../constants/appointment-error-codes.constants.js';

export class InvalidOrientationTypeException extends DomainException {
  constructor(message = 'El tema de la sesión no es válido') {
    super(message, 400, APPOINTMENT_ERROR_CODES.invalidOrientationType);
  }
}
