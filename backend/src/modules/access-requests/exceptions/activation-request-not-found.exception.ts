import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class ActivationRequestNotFoundException extends DomainException {
  constructor(message = 'No encontramos una solicitud aprobada con este correo') {
    super(message, 404, 'ACTIVATION_REQUEST_NOT_FOUND', { reason: 'not_found' });
  }
}
