import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class InvalidAttachmentTypeException extends DomainException {
  constructor(
    message = 'Formato no permitido, Solo puedes adjuntar imágenes (JPG, PNG) o documentos PDF.',
  ) {
    super(message, HttpStatus.BAD_REQUEST, 'CHAT_INVALID_ATTACHMENT_TYPE');
  }
}
