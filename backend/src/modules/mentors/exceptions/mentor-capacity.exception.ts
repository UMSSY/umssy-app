import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class MentorCapacityException extends DomainException {
  constructor() {
    super('No hay cupos disponibles', 409, 'NO_SLOTS', { code: 'NO_SLOTS' });
  }
}
