import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class BlockedDateNotOwnedException extends DomainException {
  constructor(message = 'La fecha bloqueada no pertenece al usuario') {
    super(message, 403);
  }
}
