import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class PassAccessDeniedException extends DomainException {
  constructor(message = 'No tienes autorización para acceder a este pase') {
    super(message, 403, 'PASS_ACCESS_DENIED');
  }
}
