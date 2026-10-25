import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class BlockHasAppointmentException extends DomainException {
  constructor(message = 'El bloque tiene una cita asociada') {
    super(message, 409, 'BLOCK_HAS_APPOINTMENT');
  }
}
