import { DomainException } from '../../../common/exceptions/domain.exception.js';
export class DocumentVerificationException extends DomainException {
  constructor(message: string, status: number, code: string) {
    super(message, status, code);
  }
}
