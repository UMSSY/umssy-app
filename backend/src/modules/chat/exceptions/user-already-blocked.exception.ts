import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class UserAlreadyBlockedException extends DomainException {
  constructor() {
    super('El usuario ya está bloqueado', HttpStatus.CONFLICT, 'USER_ALREADY_BLOCKED');
  }
}
