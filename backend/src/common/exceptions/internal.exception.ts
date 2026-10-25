import { DomainException } from './domain.exception.js';

export class InternalException extends DomainException {
  constructor() {
    super('Ocurrió un error interno al procesar la solicitud.', 500, 'INTERNAL_ERROR');
  }
}
