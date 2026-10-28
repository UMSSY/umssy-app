import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class TooManyAttemptsException extends DomainException {
  constructor(message = 'Has excedido el número máximo de intentos. Solicita un nuevo código.') {
    super(message, 429, 'TOO_MANY_ATTEMPTS');
  }
}
