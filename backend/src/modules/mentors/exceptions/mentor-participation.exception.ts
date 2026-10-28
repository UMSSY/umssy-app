import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class MentorParticipationException extends DomainException {
  constructor(message: string, statusCode = 409, data: unknown = null) {
    const code =
      typeof data === 'object' &&
      data !== null &&
      'code' in data &&
      typeof data.code === 'string'
        ? data.code
        : 'MENTOR_PARTICIPATION_ERROR';
    super(message, statusCode, code, data);
  }
}
