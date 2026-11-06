import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class InvalidBlockTimeException extends DomainException {
  constructor(message = 'El horario del bloque no es valido') {
    super(message, 400, 'INVALID_BLOCK_TIME');
  }
}
