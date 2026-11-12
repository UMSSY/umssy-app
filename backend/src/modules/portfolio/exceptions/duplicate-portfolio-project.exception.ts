import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class DuplicatePortfolioProjectException extends DomainException {
  constructor(
    message = 'Duplicate repository for the same provider is not allowed',
  ) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      'DUPLICATE_PORTFOLIO_PROJECT',
    );
  }
}
