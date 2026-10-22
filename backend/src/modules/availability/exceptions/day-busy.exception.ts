import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class DayBusyException extends DomainException {
  constructor(message = 'Hay otra operación en curso para ese día. Intenta de nuevo.') {
    super(message, 409);
  }
}
