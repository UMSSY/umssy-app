import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class RadarCvNotSharedException extends DomainException {
  constructor(message = 'El titular no autorizó compartir su CV') {
    super(message, HttpStatus.FORBIDDEN, 'RADAR_CV_NOT_SHARED');
  }
}
