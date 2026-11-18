import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class GoogleEmailMismatchException extends DomainException {
  constructor(
    message = 'La cuenta de Google no coincide con el correo de tu cuenta registrada.',
  ) {
    super(message, 400, 'GOOGLE_EMAIL_MISMATCH');
  }
}
