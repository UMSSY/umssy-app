import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class InvalidCredentialsException extends DomainException {
  constructor(message = 'Correo o contraseña incorrectos') {
    super(message, 401);
  }
}