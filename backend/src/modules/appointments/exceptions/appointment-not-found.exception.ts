import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class AppointmentNotFoundException extends DomainException {
  constructor() {
    super('La cita no existe', 404);
  }
}
