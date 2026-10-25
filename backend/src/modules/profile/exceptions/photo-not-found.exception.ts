import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class PhotoNotFoundException extends DomainException {
  constructor(message = 'Profile photo not found') {
    super(message, 404, 'PHOTO_NOT_FOUND');
  }
}
