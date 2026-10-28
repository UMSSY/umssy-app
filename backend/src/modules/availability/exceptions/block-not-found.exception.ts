import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class BlockNotFoundException extends DomainException {
  constructor(message = 'El bloque de disponibilidad no existe') {
    super(message, 404, 'BLOCK_NOT_FOUND');
  }
}
