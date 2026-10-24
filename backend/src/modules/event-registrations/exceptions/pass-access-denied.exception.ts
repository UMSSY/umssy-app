import { DomainException } from '../../../common/exceptions/domain.exception.js';
export class PassAccessDeniedException extends DomainException {
  constructor(message = 'No tienes autorización para acceder a este pase') {
    super(message, 403);
  }
}

export class PassNotFoundException extends DomainException {
  constructor(message = 'El pase solicitado no existe o no está disponible') {
    super(message, 404);
  }
}