import { DomainException } from '../../../common/exceptions/domain.exception.js';
export class DocumentVerificationConflictException extends DomainException {
  constructor() {
    super(
      'La versión ya cambió, fue reemplazada o no admite esta decisión.',
      409,
      'DOCUMENT_VERIFICATION_CONFLICT',
    );
  }
}
