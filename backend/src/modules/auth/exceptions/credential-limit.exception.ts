import { DomainException } from '../../../common/exceptions/domain.exception.js';
import {
  CREDENTIAL_LIMIT_CODES,
  CREDENTIAL_LIMIT_MESSAGES,
} from '../constants/credential-limits.constants.js';
import type { CredentialOperation } from '../types/credential-operation.types.js';

export class CredentialLimitException extends DomainException {
  readonly retryAfterSeconds: number;

  constructor(
    operation: CredentialOperation,
    retryAfterSeconds: number,
    cooldown = false,
  ) {
    const seconds = Math.max(1, Math.ceil(retryAfterSeconds));
    super(
      cooldown
        ? 'Espera el tiempo indicado antes de solicitar otro código.'
        : CREDENTIAL_LIMIT_MESSAGES[operation],
      429,
      cooldown ? 'PASSWORD_RESET_COOLDOWN' : CREDENTIAL_LIMIT_CODES[operation],
      {
        operation,
        retryAfterSeconds: seconds,
        retryAt: new Date(Date.now() + seconds * 1000).toISOString(),
      },
    );
    this.retryAfterSeconds = seconds;
  }
}
