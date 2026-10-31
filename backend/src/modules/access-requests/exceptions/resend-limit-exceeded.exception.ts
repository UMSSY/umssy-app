import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class ResendLimitExceededException extends DomainException {
  constructor(message = 'Alcanzaste el límite de reenvíos, intenta nuevamente en 1 hora') {
    super(message, 429, 'RESEND_LIMIT_EXCEEDED', { reason: 'resend_limit' });
  }
}
