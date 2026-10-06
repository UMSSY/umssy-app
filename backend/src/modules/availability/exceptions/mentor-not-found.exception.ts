import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class MentorNotFoundException extends DomainException {
  constructor(message = 'El mentor no existe o no está disponible') {
    super(message, 404);
  }
}
