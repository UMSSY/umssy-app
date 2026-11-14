import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class PasswordChangedException extends DomainException {
  constructor(
    message = 'Cambiaste tu contraseña. Inicia sesión nuevamente.',
  ) {
    super(message, 401, 'PASSWORD_CHANGED');
  }
}
