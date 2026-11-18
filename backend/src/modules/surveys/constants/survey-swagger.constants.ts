import { API_ERROR_SCHEMA } from '../../../common/constants/api-error-swagger.constants.js';
import type { ApiParamOptions, ApiResponseOptions } from '@nestjs/swagger';
import {
  SURVEY_ERROR_MESSAGES,
  SURVEY_VALIDATION_MESSAGES,
} from './survey.constants.js';

export const SUCCESS_DETAIL = 'Operación exitosa';
export const EXAMPLE_SURVEY_ID = '7d9c2f4e-1a3b-4c5d-8e6f-9a0b1c2d3e4f';
export const EXAMPLE_QUESTION_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
export const EXAMPLE_OPTION_ID = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
export const EXAMPLE_CAREER_ID = '0b6f1c1e-2f3a-4d5b-9c8d-7e6f5a4b3c2d';

export const ADMIN_AUTH_DESCRIPTION =
  '**Autenticación:** Bearer JWT. **Roles:** `administrativo`.';
export const RESPONDENT_AUTH_DESCRIPTION =
  '**Autenticación:** Bearer JWT. **Roles:** `titulado`, `estudiante`, `mentor` o `administrativo`.';

export function successEnvelope(
  data: Record<string, unknown>,
  statusCode = 200,
) {
  return {
    type: 'object',
    required: ['statusCode', 'ok', 'detail', 'data'],
    properties: {
      statusCode: { type: 'integer', enum: [statusCode] },
      ok: { type: 'boolean', enum: [true] },
      detail: { type: 'string', example: SUCCESS_DETAIL },
      data,
    },
  };
}

export function successExample(data: unknown, statusCode = 200) {
  return { statusCode, ok: true, detail: SUCCESS_DETAIL, data };
}

export function validationError(field: string, message: string) {
  const errors = [{ field, message }];
  return {
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    data: errors,
    detail: `${field}: ${message}`,
    ok: false,
    errors,
  };
}

export function domainError(
  statusCode: number,
  code: string,
  detail: string,
  data: unknown = null,
) {
  return { statusCode, code, data, detail, ok: false };
}

export const VALIDATION_ERROR_SCHEMA = {
  allOf: [
    API_ERROR_SCHEMA,
    {
      type: 'object',
      properties: {
        errors: {
          type: 'array',
          items: {
            type: 'object',
            required: ['field', 'message'],
            properties: {
              field: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  ],
};

export const INVALID_SURVEY_ID_EXAMPLE = {
  summary: 'Identificador de encuesta inválido',
  value: validationError('valor', SURVEY_VALIDATION_MESSAGES.INVALID_SURVEY_ID),
};

export const SURVEY_NOT_FOUND_ERROR = domainError(
  404,
  'SURVEY_NOT_FOUND',
  SURVEY_ERROR_MESSAGES.SURVEY_NOT_FOUND,
  { field: 'id' },
);

export const SURVEY_ID_PARAM: ApiParamOptions = {
  name: 'id',
  description: 'Identificador de la encuesta.',
  schema: { type: 'string', format: 'uuid' },
  example: EXAMPLE_SURVEY_ID,
};

export const SURVEY_INVALID_ID_RESPONSE: ApiResponseOptions = {
  status: 400,
  description: 'El `id` no es un UUID válido.',
  schema: VALIDATION_ERROR_SCHEMA,
  examples: { invalidId: INVALID_SURVEY_ID_EXAMPLE },
};

export const SURVEY_NOT_FOUND_RESPONSE: ApiResponseOptions = {
  status: 404,
  description: 'La encuesta no existe.',
  schema: API_ERROR_SCHEMA,
  example: SURVEY_NOT_FOUND_ERROR,
};

export const SURVEYS_STORAGE_UNAVAILABLE_RESPONSE: ApiResponseOptions = {
  status: 503,
  description:
    'Faltan los catálogos de encuestas (estado, público objetivo o tipo de pregunta) en la base de datos.',
  schema: API_ERROR_SCHEMA,
  example: domainError(
    503,
    'SURVEYS_STORAGE_UNAVAILABLE',
    SURVEY_ERROR_MESSAGES.STORAGE_UNAVAILABLE,
  ),
};
