import { DomainException } from './domain.exception.js';

export class RequestValidationException extends DomainException {
  constructor(message = 'Request validation failed') {
    super(message, 400);
  }
}
