import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class SocialAccountNotFoundException extends DomainException {
  constructor(
    message = 'La cuenta social no se encuentra vinculada',
  ) {
    super(
      message,
      HttpStatus.NOT_FOUND,
      'SOCIAL_ACCOUNT_NOT_FOUND',
    );
  }
}
