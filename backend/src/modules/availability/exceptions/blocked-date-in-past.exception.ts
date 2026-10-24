import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class BlockedDateInPastException extends DomainException {
  constructor(message = 'No se pueden bloquear fechas pasadas') {
    super(message, 400);
  }
}
