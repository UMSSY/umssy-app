import { DomainException } from './domain.exception.js';

export class ValidationException extends DomainException {
  constructor() {
    super('Los parámetros de la solicitud no son válidos.', 400, 'VALIDATION_ERROR');
  }
}
