import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { ATTENDANCE_ERROR_CODES } from '../constants/attendance-errors.constants.js';

export class AttendanceAccessDeniedException extends DomainException {
  constructor() {
    super('No tienes permiso para validar asistencias de este taller.', 403, ATTENDANCE_ERROR_CODES.accessDenied);
  }
}
