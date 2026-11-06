import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class AccountAlreadyActivatedException extends DomainException {
  constructor(message = 'Esta cuenta ya fue activada') {
    super(message, 409, 'ACCOUNT_ALREADY_ACTIVATED', { reason: 'already_activated' });
  }
}
