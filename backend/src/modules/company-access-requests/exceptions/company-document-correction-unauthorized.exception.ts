import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class CompanyDocumentCorrectionUnauthorizedException extends DomainException {
  constructor() {
    super(
      'No se pudo autorizar la corrección de la solicitud.',
      401,
      'COMPANY_DOCUMENT_CORRECTION_UNAUTHORIZED',
    );
  }
}
