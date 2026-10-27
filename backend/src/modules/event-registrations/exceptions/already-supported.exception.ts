import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class AlreadySupportedException extends DomainException {
  constructor() {
    super('Tu apoyo ya fue registrado. No puedes preinscribirte dos veces.', 409, 'ALREADY_SUPPORTED');
  }
}