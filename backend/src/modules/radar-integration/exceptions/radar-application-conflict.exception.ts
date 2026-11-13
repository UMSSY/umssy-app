import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class RadarApplicationConflictException extends DomainException {
  constructor(message = 'La postulación ya tiene una decisión o fue retirada') {
    super(message, HttpStatus.CONFLICT, 'RADAR_APPLICATION_CONFLICT');
  }
}
