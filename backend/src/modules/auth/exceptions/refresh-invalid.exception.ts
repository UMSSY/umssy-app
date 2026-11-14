import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class RefreshInvalidException extends DomainException {
  constructor(message = 'No se pudo renovar la sesión. Inicia sesión nuevamente.') {
    super(message, 401, 'REFRESH_INVALID');
  }
}
