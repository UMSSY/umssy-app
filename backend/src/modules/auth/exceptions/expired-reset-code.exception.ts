import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class ExpiredResetCodeException extends DomainException {
  constructor(message = 'El código de verificación ha expirado. Por favor, solicita uno nuevo.') {
    super(message, 400);
  }
}
