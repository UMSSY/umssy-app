import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class DayBlockedException extends DomainException {
  constructor(message = 'Ese día está bloqueado') {
    super(message, 409);
  }
}
