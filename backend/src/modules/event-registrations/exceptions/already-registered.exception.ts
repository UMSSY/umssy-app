import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { REGISTRATION_ERRORS } from '../constants/registration-errors.constants.js';

export class AlreadyRegisteredException extends DomainException {
  constructor() {
    super(REGISTRATION_ERRORS.ALREADY_REGISTERED.detail, REGISTRATION_ERRORS.ALREADY_REGISTERED.statusCode, 'ALREADY_REGISTERED');
  }
}
