import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { REGISTRATION_ERRORS } from '../constants/registration-errors.constants.js';

export class RegistrationNotFoundException extends DomainException {
  constructor() {
    super(REGISTRATION_ERRORS.REGISTRATION_NOT_FOUND.detail, REGISTRATION_ERRORS.REGISTRATION_NOT_FOUND.statusCode, 'REGISTRATION_NOT_FOUND');
  }
}
