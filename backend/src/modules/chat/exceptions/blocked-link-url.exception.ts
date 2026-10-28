import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class BlockedLinkUrlException extends DomainException {
  constructor(message = 'La dirección solicitada no está permitida por seguridad') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

