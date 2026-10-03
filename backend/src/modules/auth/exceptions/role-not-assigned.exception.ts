import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class RoleNotAssignedException extends DomainException {
  constructor(message = 'El usuario no tiene asignado el rol solicitado') {
    super(message, 403);
  }
}