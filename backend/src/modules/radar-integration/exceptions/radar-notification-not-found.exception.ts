import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class RadarNotificationNotFoundException extends DomainException {
  constructor() {
    super('Notificación no encontrada.', 404, 'RADAR_NOTIFICATION_NOT_FOUND');
  }
}
