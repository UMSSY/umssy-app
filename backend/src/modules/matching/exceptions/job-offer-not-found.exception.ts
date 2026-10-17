import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class JobOfferNotFoundException extends DomainException {
  constructor() {
    super('La vacante no existe o no está publicada.', 404);
  }
}
