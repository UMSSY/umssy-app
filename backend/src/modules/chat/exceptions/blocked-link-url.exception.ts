import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class BlockedLinkUrlException extends DomainException {
  constructor(
    url = '',
    reason = 'Dirección IP o dominio no permitido',
  ) {
    super(
      `Acceso denegado a la URL por motivos de seguridad: ${reason}`,
      HttpStatus.FORBIDDEN,
      'BLOCKED_LINK_URL',
    );
  }
}
