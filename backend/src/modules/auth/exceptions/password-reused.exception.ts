import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class PasswordReusedException extends DomainException {
  constructor() {
    super(
      'Elige una contraseña que no hayas usado antes.',
      400,
      'PASSWORD_REUSED',
    );
  }
}

