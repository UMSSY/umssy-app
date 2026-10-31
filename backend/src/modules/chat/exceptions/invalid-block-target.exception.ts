import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class InvalidBlockTargetException extends DomainException {
  constructor() {
    super('El identificador del usuario no es válido', HttpStatus.BAD_REQUEST, 'INVALID_BLOCK_TARGET');
  }
}
