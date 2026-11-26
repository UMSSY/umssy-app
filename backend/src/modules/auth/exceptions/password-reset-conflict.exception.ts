import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class PasswordResetConflictException extends DomainException {
  constructor() {
    super(
      'La contraseña cambió durante esta solicitud. Vuelve a intentarlo.',
      409,
      'PASSWORD_RESET_CONFLICT',
    );
  }
}
