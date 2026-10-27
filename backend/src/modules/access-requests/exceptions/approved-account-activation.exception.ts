import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class ApprovedAccountActivationException extends DomainException {
  constructor() {
    super(
      'No se pudo activar la cuenta. Comprueba el código, su vigencia y las credenciales.',
      400,
    );
  }
}
