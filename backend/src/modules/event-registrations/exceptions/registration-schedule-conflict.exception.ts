import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class RegistrationScheduleConflictException extends DomainException {
  constructor() {
    super(
      'Posees una inscripción confirmada en el mismo horario',
      409,
      'REGISTRATION_SCHEDULE_CONFLICT',
    );
  }
}
