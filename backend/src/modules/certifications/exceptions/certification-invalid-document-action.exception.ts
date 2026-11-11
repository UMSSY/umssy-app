import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class CertificationInvalidDocumentActionException extends DomainException {
  constructor(message = 'Acción de documento inválida') {
    super(message, 400, 'CERTIFICATION_INVALID_DOCUMENT_ACTION');
  }
}
