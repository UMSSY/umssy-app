import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { REGISTRATION_ERRORS } from '../constants/registration-errors.constants.js';

export class RegistrationNotOwnedException extends DomainException {
  constructor() {
    super(REGISTRATION_ERRORS.REGISTRATION_NOT_OWNED.detail, REGISTRATION_ERRORS.REGISTRATION_NOT_OWNED.statusCode, 'REGISTRATION_NOT_OWNED');
  }
}
