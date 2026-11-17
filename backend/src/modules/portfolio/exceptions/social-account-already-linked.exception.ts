import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class SocialAccountAlreadyLinkedException extends DomainException {
  constructor(
    message = 'Esta cuenta ya se encuentra vinculada a otro usuario',
  ) {
    super(
      message,
      HttpStatus.CONFLICT,
      'SOCIAL_ACCOUNT_ALREADY_LINKED',
    );
  }
}

