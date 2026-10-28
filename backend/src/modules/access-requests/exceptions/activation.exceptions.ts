import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class ActivationRequestNotFoundException extends DomainException {
  constructor(message = 'No encontramos una solicitud aprobada con este correo') {
    super(message, 404, 'ACTIVATION_REQUEST_NOT_FOUND', { reason: 'not_found' });
  }
}

export class AccountAlreadyActivatedException extends DomainException {
  constructor(message = 'Esta cuenta ya fue activada') {
    super(message, 409, 'ACCOUNT_ALREADY_ACTIVATED', { reason: 'already_activated' });
  }
}

export class InvalidActivationCodeException extends DomainException {
  constructor(remainingAttempts: number, message = 'El código ingresado es incorrecto') {
    super(message, 400, 'INVALID_ACTIVATION_CODE', { reason: 'code_invalid', remainingAttempts });
  }
}

export class ActivationCodeExpiredException extends DomainException {
  constructor(message = 'El código expiró, solicita uno nuevo') {
    super(message, 400, 'ACTIVATION_CODE_EXPIRED', { reason: 'code_expired' });
  }
}

export class ActivationAttemptsExceededException extends DomainException {
  constructor(message = 'Superaste el número de intentos, solicita un nuevo código') {
    super(message, 429, 'ACTIVATION_ATTEMPTS_EXCEEDED', { reason: 'attempts_exceeded' });
  }
}

export class ResendTooSoonException extends DomainException {
  constructor(retryAfterSeconds: number, message = 'Espera unos segundos antes de reenviar el código') {
    super(message, 429, 'RESEND_TOO_SOON', { reason: 'resend_cooldown', retryAfterSeconds });
  }
}

export class ResendLimitExceededException extends DomainException {
  constructor(message = 'Alcanzaste el límite de reenvíos, intenta nuevamente en 1 hora') {
    super(message, 429, 'RESEND_LIMIT_EXCEEDED', { reason: 'resend_limit' });
  }
}

export class ActivationCodeNotSentException extends DomainException {
  constructor(message = 'No pudimos enviar el código. Inténtalo de nuevo') {
    super(message, 502, 'ACTIVATION_CODE_NOT_SENT', { reason: 'code_not_sent' });
  }
}