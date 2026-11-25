import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class MissingGoogleCredentialException extends DomainException {
  constructor(message = 'Credencial de Google no proporcionada.') {
    super(message, 400, 'MISSING_GOOGLE_CREDENTIAL');
  }
}
