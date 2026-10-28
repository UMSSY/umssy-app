import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class PassNotFoundException extends DomainException {
  constructor(message = 'El pase solicitado no existe o no está disponible') {
    super(message, 404, 'PASS_NOT_FOUND');
  }
}
