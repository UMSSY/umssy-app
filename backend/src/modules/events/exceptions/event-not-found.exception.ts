import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class EventNotFoundException extends DomainException {
  constructor(_id?: string) {
    super('El evento no existe.', 404, 'EVENT_NOT_FOUND');
  }
}
