import type { CredentialOperation } from '../types/credential-operation.types.js';

export const CREDENTIAL_LIMITS = {
  windowMs: 15 * 60 * 1000,
  blockMs: 15 * 60 * 1000,
  failures: 5,
  requests: 3,
  confirmations: 5,
  cooldownMs: 2 * 60 * 1000,
} as const;

export const CREDENTIAL_LIMIT_MESSAGES: Record<CredentialOperation, string> = {
  login:
    'Alcanzaste el límite de intentos para iniciar sesión. Inténtalo más tarde.',
  request:
    'Has solicitado demasiados códigos en poco tiempo. Inténtalo más tarde.',
  verify:
    'Alcanzaste el límite de intentos para verificar el código. Inténtalo más tarde.',
  reset:
    'Has realizado demasiadas solicitudes de cambio de contraseña. Inténtalo más tarde.',
};

export const CREDENTIAL_LIMIT_CODES: Record<CredentialOperation, string> = {
  login: 'LOGIN_ATTEMPTS_LIMIT',
  request: 'PASSWORD_RESET_REQUEST_LIMIT',
  verify: 'PASSWORD_RESET_VERIFICATION_LIMIT',
  reset: 'PASSWORD_RESET_CONFIRMATION_LIMIT',
};
