import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class ApplicationNotWithdrawableException extends DomainException {
  constructor() {
    super('No se puede retirar una postulación en estado Aceptada o No seleccionado', HttpStatus.BAD_REQUEST, 'APPLICATION_NOT_WITHDRAWABLE' ,);
  }
}