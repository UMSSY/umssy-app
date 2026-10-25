import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { REGISTRATION_ERRORS } from '../constants/registration-errors.constants.js';

export class RegistrationAlreadyCancelledException extends DomainException {
  constructor() {
    super(REGISTRATION_ERRORS.REGISTRATION_ALREADY_CANCELLED.detail, REGISTRATION_ERRORS.REGISTRATION_ALREADY_CANCELLED.statusCode, 'REGISTRATION_ALREADY_CANCELLED');
  }
}
