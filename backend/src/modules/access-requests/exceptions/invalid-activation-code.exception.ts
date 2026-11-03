import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class InvalidActivationCodeException extends DomainException {
  constructor(remainingAttempts: number, message = 'El código ingresado es incorrecto') {
    super(message, 400, 'INVALID_ACTIVATION_CODE', { reason: 'code_invalid', remainingAttempts });
  }
}
