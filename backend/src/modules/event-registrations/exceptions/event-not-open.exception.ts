import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { REGISTRATION_ERRORS } from '../constants/registration-errors.constants.js';

export class EventNotOpenException extends DomainException {
  constructor() {
    super(REGISTRATION_ERRORS.EVENT_NOT_OPEN.detail, REGISTRATION_ERRORS.EVENT_NOT_OPEN.statusCode, 'EVENT_NOT_OPEN');
  }
}
