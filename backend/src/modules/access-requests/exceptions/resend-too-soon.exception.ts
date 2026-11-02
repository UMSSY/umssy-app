import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class ResendTooSoonException extends DomainException {
  constructor(retryAfterSeconds: number, message = 'Espera unos segundos antes de reenviar el código') {
    super(message, 429, 'RESEND_TOO_SOON', { reason: 'resend_cooldown', retryAfterSeconds });
  }
}
