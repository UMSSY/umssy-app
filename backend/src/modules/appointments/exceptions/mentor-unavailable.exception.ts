import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class MentorUnavailableException extends DomainException {
  constructor(message = 'El mentor no está disponible para recibir citas') {
    super(message, 403);
  }
}
