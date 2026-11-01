import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class ActivationAttemptsExceededException extends DomainException {
  constructor(message = 'Superaste el número de intentos, solicita un nuevo código') {
    super(message, 429, 'ACTIVATION_ATTEMPTS_EXCEEDED', { reason: 'attempts_exceeded' });
  }
}
