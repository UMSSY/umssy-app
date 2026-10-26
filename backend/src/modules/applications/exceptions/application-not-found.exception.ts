import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class ApplicationNotFoundException extends DomainException {
  constructor() {
    super('La postulación no existe', HttpStatus.NOT_FOUND);
  }
}