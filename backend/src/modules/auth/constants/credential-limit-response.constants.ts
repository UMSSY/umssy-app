import type { ApiResponseOptions } from '@nestjs/swagger';
import { CREDENTIAL_LIMIT_CODES } from './credential-limits.constants.js';

export const CREDENTIAL_LIMIT_RESPONSE: ApiResponseOptions = {
  status: 429,
  description: 'Restricción temporal de autenticación o recuperación.',
  headers: {
    'Retry-After': {
      description: 'Segundos que deben transcurrir antes de reintentar.',
      schema: { type: 'integer', minimum: 1 },
    },
  },
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'integer', example: 429 },
      ok: { type: 'boolean', example: false },
      code: {
        type: 'string',
        enum: [
          ...Object.values(CREDENTIAL_LIMIT_CODES),
          'PASSWORD_RESET_COOLDOWN',
        ],
      },
      detail: { type: 'string' },
      data: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['login', 'request', 'verify', 'reset'],
          },
          retryAfterSeconds: { type: 'integer', minimum: 1 },
          retryAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};
