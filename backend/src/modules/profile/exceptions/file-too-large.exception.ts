import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { MAX_FILE_SIZE_MB } from '../constants/file-upload.constants.js';

export class FileTooLargeException extends DomainException {
  constructor(
    message = `File exceeds the maximum allowed size of ${MAX_FILE_SIZE_MB} MB`,
  ) {
    super(message, 413);
  }
}
