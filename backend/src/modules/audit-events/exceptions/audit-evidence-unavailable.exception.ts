import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class AuditEvidenceUnavailableException extends DomainException {
  constructor(message = 'El documento de este evento ya no está disponible') {
    super(message, 410);
  }
}
