import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class CertificationDocumentVersionConflictException extends DomainException {
  constructor() {
    super(
      'La versión cambió. Actualiza la lista antes de continuar.',
      409,
      'CERTIFICATION_DOCUMENT_VERSION_CONFLICT',
    );
  }
}
