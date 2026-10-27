import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class JobOfferNotFoundException extends DomainException {
  constructor() {
    super('La vacante no existe o no pertenece a la empresa.', 404);
  }
}
