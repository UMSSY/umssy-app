import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class MentorAvailabilityNotOwnedException extends DomainException {
  constructor(message = 'No puedes cambiar la disponibilidad de otro mentor') {
    super(message, 403);
  }
}
