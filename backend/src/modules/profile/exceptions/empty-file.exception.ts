import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class EmptyFileException extends DomainException {
  constructor(message = 'File is required and cannot be empty') {
    super(message, 400);
  }
}
