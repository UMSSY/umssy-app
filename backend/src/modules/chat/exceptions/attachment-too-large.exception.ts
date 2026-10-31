import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class AttachmentTooLargeException extends DomainException {
  constructor(message = 'El archivo supera el tamaño máximo permitido') {
    super(message, HttpStatus.BAD_REQUEST, 'CHAT_ATTACHMENT_TOO_LARGE');
  }
}
