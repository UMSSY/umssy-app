import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class BlockOverlapException extends DomainException {
  constructor(message = 'El bloque se superpone con otro existente') {
    super(message, 409);
  }
}

export class BlockNotFoundException extends DomainException {
  constructor(message = 'El bloque de disponibilidad no existe') {
    super(message, 404);
  }
}

export class BlockNotOwnedException extends DomainException {
  constructor(message = 'El bloque no pertenece al usuario') {
    super(message, 403);
  }
}

export class BlockHasAppointmentException extends DomainException {
  constructor(message = 'El bloque tiene una cita asociada') {
    super(message, 409);
  }
}

export class InvalidBlockTimeException extends DomainException {
  constructor(message = 'El horario del bloque no es valido') {
    super(message, 400);
  }
}
