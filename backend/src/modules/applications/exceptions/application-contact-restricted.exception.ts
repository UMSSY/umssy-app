import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class ApplicationContactRestrictedException extends DomainException {
  constructor() {
    super(
      'Esta postulación ya no permite la comunicación directa con el reclutador',
      HttpStatus.FORBIDDEN,
      'APPLICATION_CONTACT_RESTRICTED',
    );
  }
}
