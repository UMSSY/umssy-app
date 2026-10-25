import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class DuplicateAccessRequestDataException extends DomainException {
  constructor(message = 'Ya existe una cuenta o solicitud con estos datos') {
    super(message, 409, 'DUPLICATE_ACCESS_REQUEST_DATA');
  }
}
