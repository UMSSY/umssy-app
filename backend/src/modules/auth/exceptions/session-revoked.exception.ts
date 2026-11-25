import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class SessionRevokedException extends DomainException {
  constructor(message = 'Tu sesión se cerró. Inicia sesión nuevamente.') {
    super(message, 401, 'SESSION_REVOKED');
  }
}
