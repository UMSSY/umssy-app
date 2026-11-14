import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class MaxPortfolioProjectsExceededException extends DomainException {
  constructor(
    message = 'A maximum of 6 featured portfolio projects is allowed',
  ) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      'MAX_PORTFOLIO_PROJECTS_EXCEEDED',
    );
  }
}
