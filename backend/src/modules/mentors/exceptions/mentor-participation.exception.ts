import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class MentorParticipationException extends DomainException {
  retryAfterSeconds?: number;
  constructor(message: string, statusCode = 409, data: unknown = null) {
    super(message, statusCode, data);
  }
}
