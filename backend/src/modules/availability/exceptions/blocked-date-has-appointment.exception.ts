import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class BlockedDateHasAppointmentException extends DomainException {
  constructor(message = 'No puedes bloquear un día con citas confirmadas') {
    super(message, 409);
  }
}
