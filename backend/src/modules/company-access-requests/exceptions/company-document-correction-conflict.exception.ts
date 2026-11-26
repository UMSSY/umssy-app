import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class CompanyDocumentCorrectionConflictException extends DomainException {
  constructor() {
    super(
      'La solicitud cambió y no se pudo registrar el documento. Consulta su estado antes de continuar.',
      409,
      'COMPANY_DOCUMENT_CORRECTION_CONFLICT',
    );
  }
}
