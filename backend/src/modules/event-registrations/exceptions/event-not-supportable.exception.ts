import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class EventNotSupportableException extends DomainException {
  constructor() {
    super('Este evento no acepta apoyos', 409, 'EVENT_NOT_SUPPORTABLE');
  }
}