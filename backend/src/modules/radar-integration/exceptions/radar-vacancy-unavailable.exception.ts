import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class RadarVacancyUnavailableException extends DomainException {
  constructor() {
    super(
      'Vacante no disponible',
      HttpStatus.NOT_FOUND,
      'RADAR_VACANCY_UNAVAILABLE',
    );
  }
}
