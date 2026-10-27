import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class ResetCodeCooldownException extends DomainException {
  constructor(message = 'Debes esperar 2 minutos antes de solicitar un nuevo código.') {
    super(message, 429);
  }
}
