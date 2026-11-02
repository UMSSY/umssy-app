import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class NotRegisteredForEventException extends DomainException {
  constructor() {
    super(
      'Solo los asistentes registrados pueden entrar',
      HttpStatus.FORBIDDEN,
      'NOT_REGISTERED_FOR_EVENT',
    );
  }
}
