import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class CvUnreadableException extends DomainException {
  constructor(
    message = 'El PDF no contiene texto seleccionable para extraer datos',
  ) {
    super(message, 422, 'CV_UNREADABLE');
  }
}
