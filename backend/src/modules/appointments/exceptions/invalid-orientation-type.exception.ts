import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class InvalidOrientationTypeException extends DomainException {
  constructor(message = 'El tema de la sesión no es válido') {
    super(message, 400);
  }
}
