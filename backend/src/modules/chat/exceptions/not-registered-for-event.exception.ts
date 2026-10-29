import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class NotRegisteredForEventException extends DomainException {
  constructor() {
    super('Solo los asistentes registrados pueden entrar');
  }
}