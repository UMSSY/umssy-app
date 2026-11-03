import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class ActivationCodeNotSentException extends DomainException {
  constructor(message = 'No pudimos enviar el código. Inténtalo de nuevo') {
    super(message, 502, 'ACTIVATION_CODE_NOT_SENT', { reason: 'code_not_sent' });
  }
}
