import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class AppointmentNotOwnedException extends DomainException {
  constructor() {
    super('No tienes acceso a esta cita', 403);
  }
}
