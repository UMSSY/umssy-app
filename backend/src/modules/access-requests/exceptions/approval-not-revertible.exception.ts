import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class ApprovalNotRevertibleException extends DomainException {
  constructor(message = 'Solo se puede revertir una aprobación automática') {
    super(message, 409, 'APPROVAL_NOT_REVERTIBLE');
  }
}
