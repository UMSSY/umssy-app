import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class InvalidLinkUrlException extends DomainException {
  constructor(message = 'La URL proporcionada no es válida') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

