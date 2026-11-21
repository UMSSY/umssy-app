import { API_ERROR_SCHEMA } from '../../../common/constants/api-error-swagger.constants.js';
import type {
  ApiParamOptions,
  ApiQueryOptions,
  ApiResponseOptions,
} from '@nestjs/swagger';
import {
  EMPLOYMENT_STATUSES,
  EXPERIENCE_LEVELS,
  HEATMAP_BASE_LABELS,
  HEATMAP_EXTRA_COLUMNS,
  HEATMAP_TYPES,
  SALARY_RANGES,
} from './heatmap.constants.js';


export const HEATMAP_OPERATION_DESCRIPTION = [
  'Devuelve la matriz habilidad × columna del mapa de calor solicitado, calculada a partir de la última respuesta de empleabilidad de cada titulado.',
  '',
  '**Autenticación:** Bearer JWT. **Roles:** `administrativo`.',
  '',
  '**Columnas según `type`:**',
  `- \`skills-by-career\`: una columna por carrera (id de la carrera). Si se envía \`careerId\`, solo se incluye esa carrera.`,
  `- \`skills-by-salary\`: rangos salariales (${SALARY_RANGES.map((range) => `\`${range.id}\``).join(', ')}).`,
  `- \`employability\`: estados laborales (${EMPLOYMENT_STATUSES.map((status) => `\`${status.id}\``).join(', ')}).`,
  `- \`skills-by-experience\`: niveles de experiencia (${EXPERIENCE_LEVELS.map((level) => `\`${level.id}\``).join(', ')}).`,
  '',
  '**Filtros temporales:** `startTimestamp`/`endTimestamp` (deben enviarse juntos) tienen prioridad sobre `year`; `month` se aplica adicionalmente sobre la fecha de respuesta en hora de Bolivia. Sin filtros se consideran todas las respuestas.',
  '',
  'Se devuelven como máximo 10 filas (habilidades). Las celdas sin titulados en la columna se marcan con `isEmpty: true`.',
  '',
  '**Nota:** por el interceptor global de respuestas, `detail` vale `OK` para los tipos `skills-by-*` y `Operación exitosa` para `employability`.',
].join('\n');

export const HEATMAP_TYPE_PARAM: ApiParamOptions = {
  name: 'type',
  description: 'Tipo de mapa de calor.',
  enum: [...HEATMAP_TYPES],
  example: 'employability',
};

export const HEATMAP_QUERY = {
  careerId: {
    name: 'careerId',
    required: false,
    description:
      'Filtra los titulados por carrera. Una carrera inexistente devuelve un mapa vacío.',
    schema: { type: 'string', format: 'uuid' },
    example: '0b6f1c1e-2f3a-4d5b-9c8d-7e6f5a4b3c2d',
  },
  year: {
    name: 'year',
    required: false,
    description:
      'Gestión (año calendario, hora de Bolivia) en que se respondió la encuesta. Se ignora si se envía un rango.',
    schema: { type: 'integer', minimum: 2000, maximum: 2100 },
    example: 2025,
  },
  month: {
    name: 'month',
    required: false,
    description: 'Mes de respuesta (1 = enero, 12 = diciembre), hora de Bolivia.',
    schema: { type: 'integer', minimum: 1, maximum: 12 },
    example: 3,
  },
  startTimestamp: {
    name: 'startTimestamp',
    required: false,
    description:
      'Inicio del rango (ISO 8601 con zona horaria). Obligatorio junto con `endTimestamp` y debe ser anterior o igual a este.',
    schema: { type: 'string', format: 'date-time' },
    example: '2025-01-01T00:00:00-04:00',
  },
  endTimestamp: {
    name: 'endTimestamp',
    required: false,
    description:
      'Fin del rango (ISO 8601 con zona horaria). Obligatorio junto con `startTimestamp`.',
    schema: { type: 'string', format: 'date-time' },
    example: '2025-06-30T23:59:59-04:00',
  },
} satisfies Record<string, ApiQueryOptions>;

const HEATMAP_CELL_SCHEMA = {
  type: 'object',
  required: ['columnId'],
  properties: {
    columnId: { type: 'string', description: 'Id de la columna.' },
    count: { type: 'integer', minimum: 0, description: 'Titulados en la celda.' },
    total: { type: 'integer', minimum: 0, description: 'Base de la celda.' },
    percentage: { type: 'number', minimum: 0, maximum: 100 },
    isEmpty: { type: 'boolean', description: 'true si la base es 0.' },
  },
};

const HEATMAP_EXTRA_VALUE_SCHEMA = {
  type: 'object',
  properties: {
    count: { type: 'integer', minimum: 0 },
    percentage: { type: 'number', minimum: 0, maximum: 100 },
    subtext: { type: 'string' },
    badgeText: { type: 'string' },
  },
};

const HEATMAP_DATA_SCHEMA = {
  type: 'object',
  required: ['heatmapType', 'baseCount', 'baseLabel', 'columns', 'rows'],
  properties: {
    heatmapType: { type: 'string', enum: [...HEATMAP_TYPES] },
    baseCount: {
      type: 'integer',
      minimum: 0,
      description: 'Cantidad de titulados considerados.',
    },
    baseLabel: {
      type: 'string',
      enum: Object.values(HEATMAP_BASE_LABELS),
    },
    columns: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'label'],
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          sublabel: { type: 'string' },
          total: { type: 'integer', minimum: 0 },
        },
      },
    },
    extraColumnsConfig: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'label'],
        properties: {
          id: {
            type: 'string',
            enum: Object.values(HEATMAP_EXTRA_COLUMNS).map((column) => column.id),
          },
          label: { type: 'string' },
          sublabel: { type: 'string' },
          format: { type: 'string', enum: ['count', 'percentage', 'badge'] },
        },
      },
    },
    rows: {
      type: 'array',
      maxItems: 10,
      items: {
        type: 'object',
        required: ['skillId', 'skillName', 'cells'],
        properties: {
          skillId: { type: 'string' },
          skillName: { type: 'string' },
          cells: { type: 'array', items: HEATMAP_CELL_SCHEMA },
          extraValues: {
            type: 'object',
            description: 'Valores por id de columna extra.',
            additionalProperties: HEATMAP_EXTRA_VALUE_SCHEMA,
          },
        },
      },
    },
    quickReadSummary: {
      type: 'string',
      description: 'Lectura rápida; se omite si no hay filas.',
    },
  },
};

export const HEATMAP_OK_RESPONSE: ApiResponseOptions = {
  status: 200,
  description: 'Mapa de calor calculado.',
  schema: {
    type: 'object',
    required: ['statusCode', 'ok', 'detail', 'data'],
    properties: {
      statusCode: { type: 'integer', enum: [200] },
      ok: { type: 'boolean', enum: [true] },
      detail: { type: 'string', enum: ['Operación exitosa', 'OK'] },
      data: HEATMAP_DATA_SCHEMA,
    },
  },
  examples: {
    employability: {
      summary: 'Empleabilidad',
      value: {
        statusCode: 200,
        ok: true,
        detail: 'Operación exitosa',
        data: {
          heatmapType: 'employability',
          baseCount: 40,
          baseLabel: HEATMAP_BASE_LABELS.employability,
          columns: [
            { id: 'employed-in-field', label: 'Empleado en su área', sublabel: '22 titulados', total: 22 },
            { id: 'employed-other-field', label: 'Empleado en otra área', sublabel: '8 titulados', total: 8 },
            { id: 'self-employed', label: 'Independiente', sublabel: '4 titulados', total: 4 },
            { id: 'job-seeking', label: 'Buscando empleo', sublabel: '6 titulados', total: 6 },
          ],
          extraColumnsConfig: [
            HEATMAP_EXTRA_COLUMNS.totalGraduates,
            HEATMAP_EXTRA_COLUMNS.jobRetention,
          ],
          rows: [
            {
              skillId: 'c3a1e2d4-5b6f-4a7c-8d9e-0f1a2b3c4d5e',
              skillName: 'TypeScript',
              cells: [
                { columnId: 'employed-in-field', count: 12, total: 20, percentage: 60, isEmpty: false },
                { columnId: 'employed-other-field', count: 4, total: 20, percentage: 20, isEmpty: false },
                { columnId: 'self-employed', count: 2, total: 20, percentage: 10, isEmpty: false },
                { columnId: 'job-seeking', count: 2, total: 20, percentage: 10, isEmpty: false },
              ],
              extraValues: {
                total_graduates: { count: 20, subtext: 'titulados' },
                job_retention: { count: 18, percentage: 90, subtext: '18 de 20' },
              },
            },
          ],
          quickReadSummary:
            'TypeScript tiene la mayor retención laboral: 90% de quienes la dominan están empleados o trabajan de forma independiente.',
        },
      },
    },
    emptyCareer: {
      summary: 'Habilidades por carrera sin datos',
      value: {
        statusCode: 200,
        ok: true,
        detail: 'OK',
        data: {
          heatmapType: 'skills-by-career',
          baseCount: 0,
          baseLabel: HEATMAP_BASE_LABELS['skills-by-career'],
          columns: [],
          rows: [],
        },
      },
    },
  },
};

export const HEATMAP_BAD_REQUEST_RESPONSE: ApiResponseOptions = {
  status: 400,
  description:
    'Parámetros inválidos (`VALIDATION_ERROR`) o rango con inicio posterior al fin (`INVALID_HEATMAP_RANGE`).',
  schema: {
    allOf: [
      API_ERROR_SCHEMA,
      {
        type: 'object',
        properties: {
          errors: {
            type: 'array',
            description: 'Solo presente en VALIDATION_ERROR.',
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
  },
  examples: {
    invalidType: {
      summary: 'Tipo de mapa de calor no soportado',
      value: {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        data: [{ field: 'type', message: 'El tipo de mapa de calor no es válido' }],
        detail: 'type: El tipo de mapa de calor no es válido',
        ok: false,
        errors: [{ field: 'type', message: 'El tipo de mapa de calor no es válido' }],
      },
    },
    incompleteRange: {
      summary: 'Rango incompleto',
      value: {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        data: [
          {
            field: 'endTimestamp',
            message: 'El inicio y el fin del rango deben enviarse juntos',
          },
        ],
        detail: 'endTimestamp: El inicio y el fin del rango deben enviarse juntos',
        ok: false,
        errors: [
          {
            field: 'endTimestamp',
            message: 'El inicio y el fin del rango deben enviarse juntos',
          },
        ],
      },
    },
    invalidRange: {
      summary: 'Inicio posterior al fin',
      value: {
        statusCode: 400,
        code: 'INVALID_HEATMAP_RANGE',
        data: { field: 'startTimestamp' },
        detail: 'El inicio del rango debe ser anterior o igual al final',
        ok: false,
      },
    },
  },
};

export const HEATMAP_EXPORT_OPERATION_DESCRIPTION = [
  'Genera el mapa de calor solicitado como documento PDF con el encabezado institucional (logotipos de la UMSS y UMSSY), los filtros aplicados y el administrador que lo generó.',
  '',
  '**Autenticación:** Bearer JWT. **Roles:** `administrativo`.',
  '',
  'Acepta los mismos filtros que `GET /analytics/heatmap/{type}`. `format=pdf` (por defecto) es el único formato del servidor; el CSV se genera en el cliente.',
].join('\n');

export const HEATMAP_EXPORT_FORMAT_QUERY: ApiQueryOptions = {
  name: 'format',
  required: false,
  description: 'Formato del archivo exportado.',
  enum: ['pdf'],
  example: 'pdf',
};

export const HEATMAP_EXPORT_OK_RESPONSE: ApiResponseOptions = {
  status: 200,
  description: 'Documento PDF generado.',
  headers: {
    'Content-Type': {
      description: 'Tipo del archivo.',
      schema: { type: 'string', enum: ['application/pdf'] },
    },
    'Content-Disposition': {
      description: 'Descarga como adjunto con el nombre del archivo.',
      schema: {
        type: 'string',
        example: 'attachment; filename="mapa-calor-employability.pdf"',
      },
    },
  },
  content: {
    'application/pdf': { schema: { type: 'string', format: 'binary' } },
  },
};

export const HEATMAP_EXPORT_AUTHOR_NOT_FOUND_RESPONSE: ApiResponseOptions = {
  status: 404,
  description:
    'No se pudo obtener el nombre del administrador autenticado para firmar el PDF (`REPORT_AUTHOR_NOT_FOUND`).',
  content: {
    'application/json': {
      schema: API_ERROR_SCHEMA,
      example: {
        statusCode: 404,
        code: 'REPORT_AUTHOR_NOT_FOUND',
        data: { field: 'userId' },
        detail: 'No se pudo identificar al administrador que genera el reporte.',
        ok: false,
      },
    },
  },
};
