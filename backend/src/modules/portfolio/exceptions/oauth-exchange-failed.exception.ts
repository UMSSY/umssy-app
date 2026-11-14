import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class OAuthExchangeFailedException extends DomainException {
  constructor(
    message = 'No se pudo completar la autenticación con el proveedor externo',
  ) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      'OAUTH_EXCHANGE_FAILED',
    );
  }
}

