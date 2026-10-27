import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class MentorExitAppointmentsException extends DomainException {
  constructor() {
    super('Resuelve las citas futuras pendientes o confirmadas en tu agenda antes de finalizar la mentoría.', 409, {
      code: 'MENTOR_HAS_FUTURE_APPOINTMENTS',
      agendaPath: '/mentor/availability',
    });
  }
}
