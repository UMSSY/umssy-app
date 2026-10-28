import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { APPOINTMENT_ERROR_CODES } from '../constants/appointment-error-codes.constants.js';

export class BlockInPastException extends DomainException {
  constructor(message = 'El horario ya pasó') {
    super(message, 400, APPOINTMENT_ERROR_CODES.blockInPast);
  }
}
