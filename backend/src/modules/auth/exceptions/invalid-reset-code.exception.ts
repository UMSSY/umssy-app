import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class InvalidResetCodeException extends DomainException {
  constructor(message = 'El código de verificación es incorrecto') {
    super(message, 400, 'INVALID_RESET_CODE');
  }
}
