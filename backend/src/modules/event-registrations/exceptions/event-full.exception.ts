import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { REGISTRATION_ERRORS } from '../constants/registration-errors.constants.js';

export class EventFullException extends DomainException {
  constructor() {
    super(REGISTRATION_ERRORS.EVENT_FULL.detail, REGISTRATION_ERRORS.EVENT_FULL.statusCode, 'EVENT_FULL');
  }
}
