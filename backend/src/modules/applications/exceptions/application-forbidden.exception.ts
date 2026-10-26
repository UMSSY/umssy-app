import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class ApplicationForbiddenException extends DomainException {
  constructor() {
    super('No tienes permisos para retirar esta postulación', HttpStatus.FORBIDDEN);
  }
}