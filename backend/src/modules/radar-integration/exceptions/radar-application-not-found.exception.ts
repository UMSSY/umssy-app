import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class RadarApplicationNotFoundException extends DomainException {
  constructor(message = 'Postulación inexistente') {
    super(message, HttpStatus.NOT_FOUND, 'RADAR_APPLICATION_NOT_FOUND');
  }
}
