import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class CannotBlockSelfException extends DomainException {
  constructor() {
    super('No puedes bloquearte a ti mismo', HttpStatus.BAD_REQUEST, 'CANNOT_BLOCK_SELF');
  }
}
