import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class ApplicationNotReactivableException extends DomainException {
  constructor() {
    super(
      'La postulación no puede reactivarse en su estado actual o la vacante ya no está disponible.',
      HttpStatus.CONFLICT,
      'APPLICATION_NOT_REACTIVABLE',
    );
  }
}
