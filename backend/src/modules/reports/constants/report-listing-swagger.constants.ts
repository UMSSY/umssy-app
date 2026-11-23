import { API_ERROR_SCHEMA } from '../../../common/constants/api-error-swagger.constants.js';
import type { ApiQueryOptions, ApiResponseOptions } from '@nestjs/swagger';
import { ROLE_NAMES } from '../../../common/enums/roles.enum.js';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '../../../common/utils/pagination.js';
import { ACCESS_REQUEST_DOCUMENT_TYPE } from '../../access-requests/types/access-request.enum.js';
import { REPORT_TYPES } from '../types/generated-report.types.js';
import { REPORT_EXPORT_QUERY } from './report-export-swagger.constants.js';

const SUCCESS_DETAIL = 'Operación exitosa';
const AUTH_DESCRIPTION =
  '**Autenticación:** Bearer JWT. **Roles:** `administrativo`.';
const PAGINATION_DESCRIPTION =
  '**Paginación:** `page` (desde 1, por defecto 1) y `limit`. La respuesta incluye `items`, `totalItems`, `totalPages`, `page` y `limit` dentro de `data`.';

export const REGISTERED_USERS_LIST_DESCRIPTION = [
  'Lista paginada de usuarios con registro aprobado, del más reciente al más antiguo (por fecha de alta).',
  '',
  AUTH_DESCRIPTION,
  '',
  `${PAGINATION_DESCRIPTION} \`limit\` admite como máximo ${DEFAULT_PAGE_SIZE}.`,
].join('\n');

export const REJECTED_USERS_LIST_DESCRIPTION = [
  'Lista paginada de solicitudes de acceso rechazadas, de la más reciente a la más antigua (por fecha de envío).',
  '',
  AUTH_DESCRIPTION,
  '',
  `${PAGINATION_DESCRIPTION} \`limit\` admite como máximo ${MAX_PAGE_SIZE}.`,
].join('\n');

export const REPORT_HISTORY_DESCRIPTION = [
  'Lista paginada de los reportes generados (CSV/PDF de usuarios y PDF de estadísticas de encuestas) por el administrador autenticado, del más reciente al más antiguo. Solo devuelve el historial propio.',
  '',
  AUTH_DESCRIPTION,
  '',
  `${PAGINATION_DESCRIPTION} \`limit\` admite como máximo ${MAX_PAGE_SIZE}.`,
].join('\n');

const pageQuery: ApiQueryOptions = {
  name: 'page',
  required: false,
  description: 'Página (desde 1).',
  schema: { type: 'integer', minimum: 1, default: 1 },
  example: 1,
};

const limitQuery = (maximum: number): ApiQueryOptions => ({
  name: 'limit',
  required: false,
  description: 'Elementos por página.',
  schema: {
    type: 'integer',
    minimum: 1,
    maximum,
    default: DEFAULT_PAGE_SIZE,
  },
  example: DEFAULT_PAGE_SIZE,
});


export const REPORT_USERS_LIST_QUERY: Record<
  | 'userType'
  | 'period'
  | 'search'
  | 'snapshotAt'
  | 'page'
  | 'registeredLimit'
  | 'rejectedLimit',
  ApiQueryOptions
> = {
  userType: REPORT_EXPORT_QUERY.userType,
  period: REPORT_EXPORT_QUERY.period,
  search: REPORT_EXPORT_QUERY.search,
  snapshotAt: REPORT_EXPORT_QUERY.snapshotAt,
  page: pageQuery,
  registeredLimit: limitQuery(DEFAULT_PAGE_SIZE),
  rejectedLimit: limitQuery(MAX_PAGE_SIZE),
};

export const REPORT_HISTORY_QUERY: Record<
  'reportType' | 'search' | 'snapshotAt' | 'page' | 'limit',
  ApiQueryOptions
> = {
  reportType: {
    name: 'reportType',
    required: false,
    description: 'Tipo de reporte. `ALL` u omitido no filtra.',
    enum: ['ALL', ...REPORT_TYPES],
    example: 'REGISTERED_USERS',
  },
  search: {
    name: 'search',
    required: false,
    description:
      'Texto a buscar en el nombre del archivo, sin distinguir mayúsculas.',
    schema: { type: 'string' },
    example: 'usuarios-registrados',
  },
  snapshotAt: {
    ...REPORT_EXPORT_QUERY.snapshotAt,
    description:
      'Fecha de corte (ISO 8601 con zona horaria): solo incluye reportes generados hasta ese instante.',
  },
  page: pageQuery,
  limit: limitQuery(MAX_PAGE_SIZE),
};

function paginatedEnvelope(item: Record<string, unknown>, maxLimit: number) {
  return {
    type: 'object',
    required: ['statusCode', 'ok', 'detail', 'data'],
    properties: {
      statusCode: { type: 'integer', enum: [200] },
      ok: { type: 'boolean', enum: [true] },
      detail: { type: 'string', example: SUCCESS_DETAIL },
      data: {
        type: 'object',
        required: ['items', 'totalItems', 'totalPages', 'page', 'limit'],
        properties: {
          items: { type: 'array', items: item },
          totalItems: { type: 'integer', minimum: 0 },
          totalPages: { type: 'integer', minimum: 0 },
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1, maximum: maxLimit },
        },
      },
    },
  };
}

const REPORT_USER_PROPERTIES = {
  id: { type: 'string', format: 'uuid' },
  fullName: { type: 'string' },
  email: { type: 'string', format: 'email' },
  userType: { type: 'string', enum: [...ROLE_NAMES] },
  identifier: {
    type: 'string',
    description: 'Carnet de identidad de la solicitud; vacío si no existe.',
  },
  documentType: {
    type: 'string',
    nullable: true,
    enum: Object.values(ACCESS_REQUEST_DOCUMENT_TYPE),
  },
  registeredAt: { type: 'string', format: 'date-time' },
};

const REPORT_USER_REQUIRED = Object.keys(REPORT_USER_PROPERTIES);

function paginatedExample(item: Record<string, unknown>, limit: number) {
  return {
    statusCode: 200,
    ok: true,
    detail: SUCCESS_DETAIL,
    data: { items: [item], totalItems: 1, totalPages: 1, page: 1, limit },
  };
}

export const REGISTERED_USERS_LIST_OK_RESPONSE: ApiResponseOptions = {
  status: 200,
  description: 'Página de usuarios registrados.',
  schema: paginatedEnvelope(
    {
      type: 'object',
      required: REPORT_USER_REQUIRED,
      properties: REPORT_USER_PROPERTIES,
    },
    DEFAULT_PAGE_SIZE,
  ),
  example: paginatedExample(
    {
      id: '3f2a1b0c-9d8e-4f7a-b6c5-d4e3f2a1b0c9',
      fullName: 'Ana Pérez',
      email: 'ana.perez@gmail.com',
      userType: 'titulado',
      identifier: '8456123',
      documentType: 'national_title',
      registeredAt: '2025-08-14T15:20:00.000Z',
    },
    DEFAULT_PAGE_SIZE,
  ),
};

export const REJECTED_USERS_LIST_OK_RESPONSE: ApiResponseOptions = {
  status: 200,
  description: 'Página de solicitudes rechazadas.',
  schema: paginatedEnvelope(
    {
      type: 'object',
      required: [...REPORT_USER_REQUIRED, 'rejectionReason'],
      properties: {
        ...REPORT_USER_PROPERTIES,
        userType: {
          type: 'string',
          enum: [...ROLE_NAMES],
          description: 'Las solicitudes de acceso siempre son de `titulado`.',
        },
        rejectionReason: { type: 'string', nullable: true },
      },
    },
    MAX_PAGE_SIZE,
  ),
  example: paginatedExample(
    {
      id: '9c8b7a6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
      fullName: 'Luis Rojas',
      email: 'luis.rojas@gmail.com',
      userType: 'titulado',
      identifier: '7012345',
      documentType: 'academic_diploma',
      rejectionReason: 'Documento ilegible',
      registeredAt: '2025-09-02T13:05:00.000Z',
    },
    DEFAULT_PAGE_SIZE,
  ),
};

export const REPORT_HISTORY_OK_RESPONSE: ApiResponseOptions = {
  status: 200,
  description: 'Página del historial de reportes generados.',
  schema: paginatedEnvelope(
    {
      type: 'object',
      required: ['id', 'fileName', 'reportType', 'generatedAt'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        fileName: { type: 'string' },
        reportType: { type: 'string', enum: [...REPORT_TYPES] },
        generatedAt: { type: 'string', format: 'date-time' },
      },
    },
    MAX_PAGE_SIZE,
  ),
  example: paginatedExample(
    {
      id: '5a4b3c2d-1e0f-4a9b-8c7d-6e5f4a3b2c1d',
      fileName: 'usuarios-registrados-titulado-II-2025.pdf',
      reportType: 'DEGREE_HOLDERS',
      generatedAt: '2026-11-16T15:00:00.000Z',
    },
    DEFAULT_PAGE_SIZE,
  ),
};

function validationError(field: string, message: string) {
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

const VALIDATION_ERROR_SCHEMA = {
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

const INVALID_SNAPSHOT_EXAMPLE = {
  summary: 'Fecha de corte inválida',
  value: validationError('snapshotAt', 'La fecha de corte no es válida'),
};

const INVALID_PAGE_EXAMPLE = {
  summary: 'Página menor a 1',
  value: validationError('page', 'Too small: expected number to be >=1'),
};

export const REPORT_USERS_LIST_BAD_REQUEST_RESPONSE: ApiResponseOptions = {
  status: 400,
  description: 'Filtros o paginación inválidos.',
  schema: VALIDATION_ERROR_SCHEMA,
  examples: {
    invalidPeriod: {
      summary: 'Gestión con formato inválido',
      value: validationError(
        'period',
        'La gestión debe tener el formato I-2025 o II-2025',
      ),
    },
    invalidSnapshot: INVALID_SNAPSHOT_EXAMPLE,
    invalidPage: INVALID_PAGE_EXAMPLE,
  },
};

export const REPORT_HISTORY_BAD_REQUEST_RESPONSE: ApiResponseOptions = {
  status: 400,
  description: 'Filtros o paginación inválidos.',
  schema: VALIDATION_ERROR_SCHEMA,
  examples: {
    invalidReportType: {
      summary: 'Tipo de reporte no soportado',
      value: validationError('reportType', 'Invalid input'),
    },
    invalidSnapshot: INVALID_SNAPSHOT_EXAMPLE,
    invalidPage: INVALID_PAGE_EXAMPLE,
  },
};
