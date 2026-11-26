import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class RadarPublicationNotFoundException extends DomainException {
  constructor() {
    super('Publicación no encontrada.', 404, 'RADAR_PUBLICATION_NOT_FOUND');
  }
}
