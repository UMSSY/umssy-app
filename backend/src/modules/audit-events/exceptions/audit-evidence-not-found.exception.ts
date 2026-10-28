import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class AuditEvidenceNotFoundException extends DomainException {
  constructor(message = 'Este evento no tiene un documento asociado') {
    super(message, 404, 'AUDIT_EVIDENCE_NOT_FOUND');
  }
}
