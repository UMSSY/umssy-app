import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class BlockNotFoundException extends DomainException {
  constructor() {
    super('No existe un bloqueo para este usuario', HttpStatus.NOT_FOUND, 'BLOCK_NOT_FOUND');
  }
}
