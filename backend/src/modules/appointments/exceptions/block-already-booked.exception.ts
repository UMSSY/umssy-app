import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class BlockAlreadyBookedException extends DomainException {
  constructor(message = 'Este horario ya fue reservado') {
    super(message, 409);
  }
}
