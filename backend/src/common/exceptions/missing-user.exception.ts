import { UnauthorizedSessionException } from './unauthorized-session.exception.js';

export class MissingUserException extends UnauthorizedSessionException {
  constructor(message = 'Se requiere una sesión válida.') {
    super(message);
  }
}
