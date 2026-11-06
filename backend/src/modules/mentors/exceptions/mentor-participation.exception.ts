import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class MentorParticipationException extends DomainException {
  retryAfterSeconds?: number;
  constructor(
    message: string,
    statusCode = 409,
    data: unknown = null,
    codeOverride?: string,
  ) {
    const code =
      typeof data === 'object' &&
      data !== null &&
      'code' in data &&
      typeof data.code === 'string'
        ? data.code
        : 'MENTOR_PARTICIPATION_ERROR';
    super(message, statusCode, codeOverride ?? code, data);
  }
}
