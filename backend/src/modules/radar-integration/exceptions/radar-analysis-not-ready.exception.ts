import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class RadarAnalysisNotReadyException extends DomainException {
  constructor() {
    super(
      'El análisis sigue pendiente o falló; puedes reintentarlo.',
      409,
      'RADAR_ANALYSIS_NOT_READY',
    );
  }
}
