import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class CityNotFoundException extends DomainException {
  constructor(message = 'City not found') {
    super(message, 404, 'CITY_NOT_FOUND');
  }
}
