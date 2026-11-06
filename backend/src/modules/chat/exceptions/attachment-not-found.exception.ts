import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class AttachmentNotFoundException extends DomainException {
  constructor(message = 'Archivo adjunto no encontrado') {
    super(message, HttpStatus.NOT_FOUND, 'CHAT_ATTACHMENT_NOT_FOUND');
  }
}
