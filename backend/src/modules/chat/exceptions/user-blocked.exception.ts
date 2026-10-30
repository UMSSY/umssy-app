import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class UserBlockedException extends DomainException {
  constructor() {
    super('No es posible enviar mensajes en esta conversación', HttpStatus.FORBIDDEN, 'USER_BLOCKED');
  }
}
