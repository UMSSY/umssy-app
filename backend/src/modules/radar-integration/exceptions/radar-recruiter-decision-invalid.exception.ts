import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class RadarRecruiterDecisionInvalidException extends DomainException {
  constructor() {
    super('Decisión inválida', HttpStatus.BAD_REQUEST, 'RADAR_DECISION_INVALID');
  }
}
