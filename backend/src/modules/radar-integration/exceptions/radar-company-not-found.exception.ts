import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class RadarCompanyNotFoundException extends DomainException {
  constructor() {
    super('Empresa inexistente', HttpStatus.NOT_FOUND, 'RADAR_COMPANY_NOT_FOUND');
  }
}
