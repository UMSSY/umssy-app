import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class UnsupportedPortfolioProviderException extends DomainException {
  constructor(provider: string) {
    super(
      `Unsupported portfolio provider: ${provider}`,
      HttpStatus.BAD_REQUEST,
      'UNSUPPORTED_PORTFOLIO_PROVIDER',
    );
  }
}
