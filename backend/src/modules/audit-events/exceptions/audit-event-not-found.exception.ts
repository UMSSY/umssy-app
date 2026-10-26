import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class AuditEventNotFoundException extends DomainException {
  constructor(message = 'El evento de auditoría no existe') {
    super(message, 404);
  }
}
