import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class BlockedDateNotFoundException extends DomainException {
  constructor(message = 'La fecha bloqueada no existe') {
    super(message, 404);
  }
}
