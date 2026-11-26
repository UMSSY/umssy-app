import type { ApiResponseOptions, SchemaObject } from '@nestjs/swagger';
import { HTTP_ERRORS } from './http-errors.constants.js';

export const API_ERROR_SCHEMA: SchemaObject = {
  type: 'object',
  required: ['statusCode', 'ok', 'code', 'detail', 'data'],
  properties: {
    statusCode: { type: 'integer', description: 'Código de estado HTTP.' },
    ok: { type: 'boolean', enum: [false] },
    code: { type: 'string', description: 'Código del error.' },
    detail: { type: 'string', description: 'Descripción del error.' },
    data: { nullable: true, description: 'Datos adicionales del error.' },
  },
};

const apiErrorResponse = (
  status: number,
  code: string,
  detail: string,
  description: string,
): ApiResponseOptions => ({
  status,
  description,
  content: {
    'application/json': {
      schema: API_ERROR_SCHEMA,
      example: { statusCode: status, ok: false, code, detail, data: null },
    },
  },
});

export const UNAUTHENTICATED_RESPONSE = apiErrorResponse(
  401,
  HTTP_ERRORS[401].code,
  HTTP_ERRORS[401].detail,
  'Token Bearer JWT ausente, inválido o expirado, o sesión revocada (`UNAUTHENTICATED`).',
);

export const FORBIDDEN_ROLE_RESPONSE = apiErrorResponse(
  403,
  'FORBIDDEN_ROLE',
  'No tienes el rol necesario para este recurso',
  'El usuario autenticado no tiene ninguno de los roles requeridos (`FORBIDDEN_ROLE`).',
);

export const INTERNAL_ERROR_RESPONSE = apiErrorResponse(
  500,
  HTTP_ERRORS[500].code,
  HTTP_ERRORS[500].detail,
  'Error interno no controlado (`INTERNAL_ERROR`).',
);
