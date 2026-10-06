import { DomainException } from './domain.exception.js';
import type { ValidationError } from '../types/validation-error.types.js';
export class RequestValidationException extends DomainException {
  constructor(readonly errors: ValidationError[]) {
    super('Los datos de la solicitud no son válidos.', 400);
  }
}
