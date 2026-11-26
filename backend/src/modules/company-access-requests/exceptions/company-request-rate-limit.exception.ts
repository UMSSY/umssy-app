import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class CompanyRequestRateLimitException extends DomainException {
  constructor() {
    super(
      'Realizaste demasiados intentos. Espera unos minutos antes de volver a intentarlo.',
      429,
      'COMPANY_REQUEST_RATE_LIMIT',
    );
  }
}
