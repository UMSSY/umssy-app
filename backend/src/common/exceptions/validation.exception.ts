import { DomainException } from './domain.exception.js';

export class ValidationException extends DomainException {
  constructor(public readonly issues: readonly { path: string[]; message: string }[]) {
    super('Validation failed', 400);
  }
}