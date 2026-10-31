import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class DocumentCorrectionUnauthorizedException extends DomainException {
  constructor() {
    super('No se pudo autorizar la corrección de la solicitud.', 401, 'DOCUMENT_CORRECTION_UNAUTHORIZED');
  }
}
