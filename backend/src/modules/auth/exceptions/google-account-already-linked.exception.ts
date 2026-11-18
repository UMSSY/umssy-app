import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class GoogleAccountAlreadyLinkedException extends DomainException {
  constructor(
    message = 'Esta cuenta de Google ya está vinculada a otro usuario.',
  ) {
    super(message, 409, 'GOOGLE_ACCOUNT_ALREADY_LINKED');
  }
}
