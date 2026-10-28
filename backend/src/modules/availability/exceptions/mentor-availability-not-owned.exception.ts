import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { AVAILABILITY_ERROR_CODES } from '../constants/availability-error-codes.constants.js';

export class MentorAvailabilityNotOwnedException extends DomainException {
  constructor(message = 'No puedes cambiar la disponibilidad de otro mentor') {
    super(message, 403, AVAILABILITY_ERROR_CODES.mentorAvailabilityNotOwned);
  }
}
