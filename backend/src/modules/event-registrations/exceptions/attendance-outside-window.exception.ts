import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { ATTENDANCE_ERROR_CODES } from '../constants/attendance-errors.constants.js';

export class AttendanceOutsideWindowException extends DomainException {
  constructor() {
    super('El registro de asistencia está fuera del horario del taller.', 409, ATTENDANCE_ERROR_CODES.outsideWindow);
  }
}
