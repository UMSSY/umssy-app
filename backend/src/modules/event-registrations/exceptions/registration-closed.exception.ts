import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { REGISTRATION_ERRORS } from '../constants/registration-errors.constants.js';

export class RegistrationClosedException extends DomainException {
  constructor() {
    super(REGISTRATION_ERRORS.REGISTRATION_CLOSED.detail, REGISTRATION_ERRORS.REGISTRATION_CLOSED.statusCode, 'REGISTRATION_CLOSED');
  }
}
