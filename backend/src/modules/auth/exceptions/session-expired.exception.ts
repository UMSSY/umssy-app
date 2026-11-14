import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class SessionExpiredException extends DomainException {
  constructor(message = 'Tu sesión expiró. Inicia sesión nuevamente.') {
    super(message, 401, 'SESSION_EXPIRED');
  }
}
