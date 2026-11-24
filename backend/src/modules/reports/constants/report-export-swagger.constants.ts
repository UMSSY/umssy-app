import { API_ERROR_SCHEMA } from '../../../common/constants/api-error-swagger.constants.js';
import type { ApiQueryOptions, ApiResponseOptions } from '@nestjs/swagger';
import { DEFAULT_PAGE_SIZE } from '../../../common/utils/pagination.js';
import { ROLE_NAMES } from '../../../common/enums/roles.enum.js';
import { REPORT_USER_CSV_HEADERS } from './report-user-csv.constants.js';

const BINARY_SCHEMA = { type: 'string', format: 'binary' } as const;

const EXPORT_DESCRIPTION_COMMON = [
  '**Autenticación:** Bearer JWT. **Roles:** `administrativo`.',
  '',
  '**Formato:** `format=csv` (por defecto) devuelve `text/csv; charset=utf-8` (con BOM UTF-8, separador `,`, saltos `CRLF` y fechas `DD/MM/AAAA` en hora de Bolivia) con las columnas ' +
    REPORT_USER_CSV_HEADERS.map((header) => `"${header}"`).join(', ') +
    '; `format=pdf` devuelve `application/pdf` con encabezado institucional, filtros aplicados y autor (nombre del administrador autenticado).',
  '',
  '**Descarga:** la respuesta se envía como adjunto en la cabecera `Content-Disposition` (`attachment; filename="..."`), expuesta por CORS. No se envuelve en el formato estándar `{ statusCode, ok, detail, data }`.',
  '',
  '**Paginación:** `page` y `limit` son opcionales pero deben enviarse juntos; sin ellos se exportan todos los registros que cumplan los filtros, del más reciente al más antiguo.',
  '',
  'Cada exportación exitosa queda registrada en el historial de reportes del usuario (`GET /reports/history`).',
].join('\n');

export const REGISTERED_USERS_EXPORT_DESCRIPTION = [
  'Exporta los usuarios con registro aprobado que cumplen los filtros.',
  '',
  EXPORT_DESCRIPTION_COMMON,
  '',
  'Nombre del archivo: `usuarios-registrados[-<tipo>][-<búsqueda>]-<gestión|todos>.<csv|pdf>`.',
].join('\n');

export const REJECTED_USERS_EXPORT_DESCRIPTION = [
  'Exporta los usuarios con solicitud de registro rechazada que cumplen los filtros.',
  '',
  EXPORT_DESCRIPTION_COMMON,
  '',
  'Nombre del archivo: `usuarios-rechazados[-<tipo>][-<búsqueda>]-<gestión|AAAA-MM-DD de hoy>.<csv|pdf>`.',
].join('\n');

export const REPORT_EXPORT_QUERY = {
  userType: {
    name: 'userType',
    required: false,
    description: 'Tipo de usuario (rol). `ALL` u omitido no filtra.',
    enum: ['ALL', ...ROLE_NAMES],
    example: 'titulado',
  },
  period: {
    name: 'period',
    required: false,
    description:
      'Gestión académica de registro (`I` = enero a junio, `II` = julio a diciembre, hora de Bolivia). `ALL` u omitido no filtra.',
    schema: { type: 'string', pattern: '^(ALL|(I|II)-\\d{4})$' },
    example: 'II-2025',
  },
  search: {
    name: 'search',
    required: false,
    description:
      'Texto a buscar en el correo, sin distinguir mayúsculas ni tildes.',
    schema: { type: 'string' },
    example: 'gmail.com',
  },
  snapshotAt: {
    name: 'snapshotAt',
    required: false,
    description:
      'Fecha de corte (ISO 8601 con zona horaria): solo incluye usuarios listados hasta ese instante.',
    schema: { type: 'string', format: 'date-time' },
    example: '2026-11-16T12:00:00-04:00',
  },
  page: {
    name: 'page',
    required: false,
    description: 'Página a exportar (desde 1). Requiere `limit`.',
    schema: { type: 'integer', minimum: 1 },
    example: 1,
  },
  limit: {
    name: 'limit',
    required: false,
    description: 'Registros por página. Requiere `page`.',
    schema: { type: 'integer', minimum: 1, maximum: DEFAULT_PAGE_SIZE },
    example: DEFAULT_PAGE_SIZE,
  },
  format: {
    name: 'format',
    required: false,
    description: 'Formato del archivo.',
    schema: { type: 'string', enum: ['csv', 'pdf'], default: 'csv' },
    example: 'pdf',
  },
} satisfies Record<string, ApiQueryOptions>;

function fileResponse(fileExample: string): ApiResponseOptions {
  return {
    status: 200,
    description: 'Archivo CSV o PDF generado.',
    headers: {
      'Content-Type': {
        description: 'Tipo del archivo según `format`.',
        schema: {
          type: 'string',
          enum: ['text/csv; charset=utf-8', 'application/pdf'],
        },
      },
      'Content-Disposition': {
        description: 'Descarga como adjunto con el nombre del archivo.',
        schema: {
          type: 'string',
          example: `attachment; filename="${fileExample}.csv"`,
        },
      },
    },
    content: {
      'text/csv': {
        schema: BINARY_SCHEMA,
        example: `${REPORT_USER_CSV_HEADERS.join(',')}\r\nAna Pérez,ana.perez@gmail.com,Titulado,201901234,Título en provisión nacional,14/08/2025\r\n`,
      },
      'application/pdf': { schema: BINARY_SCHEMA },
    },
  };
}

export const REGISTERED_USERS_EXPORT_OK_RESPONSE = fileResponse(
  'usuarios-registrados-titulado-II-2025',
);

export const REJECTED_USERS_EXPORT_OK_RESPONSE = fileResponse(
  'usuarios-rechazados-titulado-II-2025',
);

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

export const REPORT_EXPORT_BAD_REQUEST_RESPONSE: ApiResponseOptions = {
  status: 400,
  description: 'Filtros inválidos.',
  content: {
    'application/json': {
      schema: VALIDATION_ERROR_SCHEMA,
      examples: {
        incompletePagination: {
          summary: 'page sin limit',
          value: validationError(
            'limit',
            'La página y el límite deben enviarse juntos',
          ),
        },
        invalidPeriod: {
          summary: 'Gestión con formato inválido',
          value: validationError(
            'period',
            'La gestión debe tener el formato I-2025 o II-2025',
          ),
        },
        invalidSnapshot: {
          summary: 'Fecha de corte inválida',
          value: validationError(
            'snapshotAt',
            'La fecha de corte no es válida',
          ),
        },
      },
    },
  },
};

export const REPORT_EXPORT_AUTHOR_NOT_FOUND_RESPONSE: ApiResponseOptions = {
  status: 404,
  description:
    'Solo con `format=pdf`: no se pudo obtener el nombre del administrador autenticado para firmar el reporte.',
  content: {
    'application/json': {
      schema: API_ERROR_SCHEMA,
      example: {
        statusCode: 404,
        code: 'REPORT_AUTHOR_NOT_FOUND',
        data: { field: 'userId' },
        detail:
          'No se pudo identificar al administrador que genera el reporte.',
        ok: false,
      },
    },
  },
};
