import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class ExternalProviderUnavailableException extends DomainException {
  constructor(
    message = 'El servicio externo no está disponible temporalmente. Intenta nuevamente más tarde',
  ) {
    super(
      message,
      HttpStatus.BAD_GATEWAY,
      'EXTERNAL_PROVIDER_UNAVAILABLE',
    );
  }
}

