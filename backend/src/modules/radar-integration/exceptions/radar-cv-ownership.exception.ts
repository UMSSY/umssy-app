import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class RadarCvOwnershipException extends DomainException {
  constructor() {
    super('El CV no pertenece al titular', 403, 'RADAR_CV_OWNERSHIP_DENIED');
  }
}
