const AUTH_TOKEN_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    accessToken: { type: 'string' },
    roleTag: { type: 'string', example: 'titulado' },
    roles: {
      type: 'array',
      items: { type: 'string' },
      example: ['titulado'],
    },
  },
};

export const AUTH_SESSION_OK_RESPONSE = {
  description:
    'Identidad de sesión activa, roles, empresa asociada opcional y límites de inactividad.',
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      roleTag: { type: 'string', example: 'titulado' },
      roles: { type: 'array', items: { type: 'string' } },
      idleTimeoutSeconds: { type: 'integer', example: 1800 },
      warningSeconds: { type: 'integer', example: 120 },
      absoluteExpiresAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
      },
    },
  },
};

export const AUTH_LOGIN_BODY = {
  description: 'Credenciales de acceso con correo y contraseña.',
  schema: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'usuario@umss.edu.bo',
      },
      password: { type: 'string', format: 'password', example: 'ClaveSegura2026' },
      roleTag: { type: 'string', example: 'titulado' },
    },
  },
};

export const AUTH_GOOGLE_BODY = {
  description: 'Token ID emitido por Google Identity Services.',
  schema: {
    type: 'object',
    properties: {
      credential: { type: 'string' },
      idToken: { type: 'string' },
      roleTag: { type: 'string', example: 'titulado' },
    },
  },
};

export const AUTH_TOKEN_CREATED_RESPONSE = {
  description:
    'Sesión iniciada correctamente; establece cookies HttpOnly y devuelve credenciales de sesión.',
  schema: AUTH_TOKEN_RESPONSE_SCHEMA,
};

export const AUTH_REFRESH_OK_RESPONSE = {
  description:
    'Token rotado correctamente; reemite cookies HttpOnly de sesión y credencial actualizada.',
  schema: AUTH_TOKEN_RESPONSE_SCHEMA,
};

export const AUTH_GOOGLE_LINK_OK_RESPONSE = {
  description: 'Cuenta de Google vinculada al usuario autenticado.',
  schema: {
    type: 'object',
    properties: {
      ok: { type: 'boolean', example: true },
      detail: {
        type: 'string',
        example: 'Cuenta vinculada exitosamente.',
      },
    },
  },
};

export const AUTH_PASSWORD_RESET_REQUEST_BODY = {
  description: 'Correo de la cuenta para enviar el código OTP de recuperación.',
  schema: {
    type: 'object',
    required: ['email'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'usuario@umss.edu.bo',
      },
    },
  },
};

export const AUTH_PASSWORD_RESET_VERIFY_BODY = {
  description: 'Correo y código OTP de 6 dígitos a verificar.',
  schema: {
    type: 'object',
    required: ['email', 'code'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'usuario@umss.edu.bo',
      },
      code: { type: 'string', example: '123456' },
    },
  },
};

export const AUTH_PASSWORD_RESET_BODY = {
  description: 'Correo, código OTP verificado y nueva contraseña.',
  schema: {
    type: 'object',
    required: ['email', 'code', 'newPassword'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'usuario@umss.edu.bo',
      },
      code: { type: 'string', example: '123456' },
      newPassword: {
        type: 'string',
        format: 'password',
        example: 'NuevaClaveSegura2026',
      },
    },
  },
};
