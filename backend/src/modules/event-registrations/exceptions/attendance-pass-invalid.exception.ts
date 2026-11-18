import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { ATTENDANCE_ERROR_CODES } from '../constants/attendance-errors.constants.js';

export class AttendancePassInvalidException extends DomainException {
  constructor() {
    super('Pase inválido.', 422, ATTENDANCE_ERROR_CODES.passInvalid);
  }
}
