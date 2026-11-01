import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class InvalidLinkUrlException extends DomainException {
  constructor(message = 'La URL proporcionada es inválida o no permitida') {
    super(message, HttpStatus.BAD_REQUEST, 'INVALID_LINK_URL');
  }
}
