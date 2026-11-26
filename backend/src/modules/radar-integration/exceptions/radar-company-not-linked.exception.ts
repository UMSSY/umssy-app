import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class RadarCompanyNotLinkedException extends DomainException {
  constructor() {
    super(
      'Empresa no vinculada a esta sesión',
      HttpStatus.FORBIDDEN,
      'RADAR_COMPANY_NOT_LINKED',
    );
  }
}
