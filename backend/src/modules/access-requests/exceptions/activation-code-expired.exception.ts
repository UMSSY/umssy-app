import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class ActivationCodeExpiredException extends DomainException {
  constructor(message = 'El código expiró, solicita uno nuevo') {
    super(message, 400, 'ACTIVATION_CODE_EXPIRED', { reason: 'code_expired' });
  }
}
