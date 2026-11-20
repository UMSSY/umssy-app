import { DomainException } from '../../../common/exceptions/domain.exception.js';
export class DocumentVerificationFileNotFoundException extends DomainException {
  constructor() {
    super(
      'El archivo no está disponible.',
      404,
      'DOCUMENT_VERIFICATION_FILE_NOT_FOUND',
    );
  }
}
