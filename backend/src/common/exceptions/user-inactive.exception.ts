import { DomainException } from './domain.exception.js';

export class UserInactiveException extends DomainException {
  constructor() {
    super('La cuenta del usuario está inactiva.', 403, 'USER_INACTIVE');
  }
}
