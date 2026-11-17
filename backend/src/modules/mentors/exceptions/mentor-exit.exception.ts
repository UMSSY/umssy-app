import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class MentorExitAppointmentsException extends DomainException {
  constructor() {
    super(
      'Debes resolver tus citas futuras pendientes o confirmadas antes de pausar la mentoría. Consulta tus citas en la agenda.',
      409,
      'MENTOR_HAS_FUTURE_APPOINTMENTS',
      {
        code: 'MENTOR_HAS_FUTURE_APPOINTMENTS',
        agendaPath: '/appointments',
      },
    );
  }
}
