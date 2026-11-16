import { applyDecorators } from '@nestjs/common';
import { ApiResponse, type ApiResponseOptions } from '@nestjs/swagger';
import {
  FORBIDDEN_ROLE_ERROR,
  UNAUTHENTICATED_ERROR,
  USER_INACTIVE_ERROR,
  VALIDATION_ERROR_CODE,
  VALIDATION_ERROR_SUMMARY,
} from '../constants/api-errors.constants.js';
import type { ApiErrorExample } from '../types/api-error-example.type.js';
import type { ValidationErrorDetail } from '../types/validation-error-detail.type.js';
import {
  apiArray,
  apiBoolean,
  apiEnum,
  apiInteger,
  apiNullable,
  apiObject,
  apiString,
  type ApiSchema,
} from '../utils/api-schema.js';

interface ApiErrorResponseOptions {
  status: number;
  description: string;
  errors?: readonly ApiErrorExample[];
  validation?: readonly ValidationErrorDetail[];
}

interface ApiAuthResponsesOptions {
  roles?: readonly string[];
  forbidden?: readonly ApiErrorExample[];
}

function formatValidationDetail(
  validation: readonly ValidationErrorDetail[],
): string {
  return validation
    .map(({ field, message }) => (field ? `${field}: ${message}` : message))
    .join('; ');
}

export function apiErrorResponse({
  status,
  description,
  errors = [],
  validation,
}: ApiErrorResponseOptions) {
  const variants: ApiErrorExample[] = [
    ...(validation
      ? [
          {
            code: VALIDATION_ERROR_CODE,
            detail: formatValidationDetail(validation),
          },
        ]
      : []),
    ...errors,
  ];
  const [first] = variants;
  if (!first) {
    throw new Error('An API error response needs at least one error');
  }

  const issueSchema: ApiSchema = apiObject({
    field: apiString(validation?.[0]?.field ?? ''),
    message: apiString(validation?.[0]?.message ?? ''),
  });
  const properties: Record<string, ApiSchema> = {
    statusCode: apiInteger(status),
    ok: apiBoolean(false),
    code: apiEnum([...new Set(variants.map(({ code }) => code))], first.code),
    detail: apiString(first.detail),
    data: validation
      ? apiNullable(apiArray(issueSchema), validation)
      : apiNullable({ type: 'object' }),
    ...(validation && {
      errors: { ...apiArray(issueSchema), example: validation },
    }),
  };
  const lines = [
    ...(validation
      ? [`- \`${VALIDATION_ERROR_CODE}\`: ${VALIDATION_ERROR_SUMMARY}`]
      : []),
    ...errors.map(({ code, detail }) => `- \`${code}\`: ${detail}`),
  ];

  return ApiResponse({
    status,
    description: `${description}\n\n${lines.join('\n')}`,
    schema: {
      type: 'object',
      required: ['statusCode', 'ok', 'code', 'detail', 'data'],
      properties,
      example: {
        statusCode: status,
        code: first.code,
        data: validation ?? null,
        detail: first.detail,
        ok: false,
        ...(validation && { errors: validation }),
      },
    },
  } as ApiResponseOptions);
}

export function apiAuthResponses({
  roles,
  forbidden = [],
}: ApiAuthResponsesOptions = {}) {
  const forbiddenDescription = roles
    ? `Acceso denegado. Roles permitidos: ${roles.join(', ')}`
    : 'Acceso denegado';

  return applyDecorators(
    apiErrorResponse({
      status: 401,
      description: 'Falta el token de acceso o no es válido',
      errors: [UNAUTHENTICATED_ERROR],
    }),
    apiErrorResponse({
      status: 403,
      description: forbiddenDescription,
      errors: [
        ...(roles ? [FORBIDDEN_ROLE_ERROR] : []),
        ...forbidden,
        USER_INACTIVE_ERROR,
      ],
    }),
  );
}
