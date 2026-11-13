import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class UnknownPortfolioProviderException extends DomainException {
  constructor(provider: string) {
    super(
      `Unknown portfolio provider: ${provider}`,
      HttpStatus.BAD_REQUEST,
      'UNKNOWN_PORTFOLIO_PROVIDER',
    );
  }
}
