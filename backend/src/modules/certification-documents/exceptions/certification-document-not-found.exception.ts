import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class CertificationDocumentNotFoundException extends DomainException {
  constructor(message = 'Certification document not found') {
    super(message, 404, 'CERTIFICATION_DOCUMENT_NOT_FOUND');
  }
}
