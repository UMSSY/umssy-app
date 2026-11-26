import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class CvExtractionFailedException extends DomainException {
  constructor(message = 'No se pudo leer el contenido del PDF') {
    super(message, 422, 'CV_EXTRACTION_FAILED');
  }
}
