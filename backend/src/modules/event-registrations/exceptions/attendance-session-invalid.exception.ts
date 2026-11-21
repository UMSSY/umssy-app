import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { ATTENDANCE_ERROR_CODES } from '../constants/attendance-errors.constants.js';

export class AttendanceSessionInvalidException extends DomainException {
  constructor() {
    super('La sesión no pertenece al taller.', 422, ATTENDANCE_ERROR_CODES.sessionInvalid);
  }
}
