import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class BlockInPastException extends DomainException {
  constructor(message = 'El horario ya pasó') {
    super(message, 400);
  }
}
