import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class RadarPublicationPendingAnalysisException extends DomainException {
  constructor() {
    super('El análisis del perfil aún no está actualizado.', 409, 'RADAR_PUBLICATION_PENDING_ANALYSIS');
  }
}
