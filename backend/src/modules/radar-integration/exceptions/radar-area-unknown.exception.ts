import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class RadarAreaUnknownException extends DomainException {
  constructor() {
    super(
      'Área de afinidad desconocida',
      HttpStatus.BAD_REQUEST,
      'RADAR_AREA_UNKNOWN',
    );
  }
}
