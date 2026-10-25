import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class DocumentRequiredToSubmitException extends DomainException {
  constructor(message = 'Debes adjuntar tu documento de respaldo antes de enviar la solicitud') {
    super(message, 400, 'DOCUMENT_REQUIRED_TO_SUBMIT');
  }
}
