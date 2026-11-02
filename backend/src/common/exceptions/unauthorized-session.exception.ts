import { DomainException } from './domain.exception.js';

export class UnauthorizedSessionException extends DomainException {
  constructor(message = 'Se requiere una sesión válida.') {
    super(message, 401, 'UNAUTHENTICATED');
  }
}
