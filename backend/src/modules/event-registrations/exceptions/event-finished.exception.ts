import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { REGISTRATION_ERRORS } from '../constants/registration-errors.constants.js';

export class EventFinishedException extends DomainException {
  constructor() {
    super(
      REGISTRATION_ERRORS.EVENT_FINISHED.detail,
      REGISTRATION_ERRORS.EVENT_FINISHED.statusCode,
      'EVENT_FINISHED',
    );
  }
}