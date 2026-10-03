import { DomainException } from './domain.exception.js';

export class MissingUserException extends DomainException {
  constructor(message = 'Authenticated user is required') {
    super(message, 401);
  }
}
