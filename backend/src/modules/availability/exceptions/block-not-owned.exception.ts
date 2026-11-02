import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class BlockNotOwnedException extends DomainException {
  constructor(message = 'El bloque no pertenece al usuario') {
    super(message, 403, 'BLOCK_NOT_OWNED');
  }
}
