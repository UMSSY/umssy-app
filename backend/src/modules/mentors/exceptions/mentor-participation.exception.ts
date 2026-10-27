import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class MentorParticipationException extends DomainException {
  constructor(message: string, statusCode = 409) {
    super(message, statusCode);
  }
}
