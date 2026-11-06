import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class RadarCvNotFoundException extends DomainException {
  constructor(message = 'CV inexistente o sin archivo') {
    super(message, 404, 'RADAR_CV_NOT_FOUND');
  }
}
