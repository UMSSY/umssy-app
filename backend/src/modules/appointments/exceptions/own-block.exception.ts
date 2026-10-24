import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class OwnBlockException extends DomainException {
  constructor(message = 'No puedes reservar tu propio horario') {
    super(message, 403);
  }
}
