import { SYSTEM_RESPONSIBLE_ID } from './audit-events.constants.js';
import { AUDIT_ACTION } from '../types/audit-action.enum.js';
import { AUDIT_ACTOR_ROLE } from '../types/audit-actor-role.enum.js';

export const AUDIT_EVENT_ID_PARAM = {
  name: 'id',
  required: true,
  description: 'Identificador UUID del evento de auditoría.',
  schema: { type: 'string', format: 'uuid' },
  example: '550e8400-e29b-41d4-a716-446655440000',
};

export const AUDIT_EVENT_FILTER_QUERIES = [
  {
    name: 'search',
    required: false,
    description: 'Búsqueda por solicitante o código (mín. 2 caracteres).',
    schema: { type: 'string', minLength: 2, maxLength: 100 },
  },
  {
    name: 'action',
    required: false,
    description: 'Filtrar por tipo de acción de auditoría.',
    schema: { type: 'string', enum: Object.values(AUDIT_ACTION) },
  },
  {
    name: 'responsibleId',
    required: false,
    description: `UUID del responsable o '${SYSTEM_RESPONSIBLE_ID}' para eventos del sistema.`,
    schema: { type: 'string' },
  },
  {
    name: 'from',
    required: false,
    description: 'Fecha inicial inclusive en formato AAAA-MM-DD.',
    schema: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
  },
  {
    name: 'to',
    required: false,
    description: 'Fecha final inclusive en formato AAAA-MM-DD.',
    schema: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
  },
] as const;

export const AUDIT_EVENT_PAGINATION_QUERIES = [
  {
    name: 'page',
    required: false,
    description: 'Número de página (base 1).',
    schema: { type: 'integer', minimum: 1, default: 1 },
  },
  {
    name: 'limit',
    required: false,
    description: 'Cantidad de resultados por página (1 a 50).',
    schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
  },
] as const;

const AUDIT_RESPONSIBLE_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid', nullable: true },
    name: { type: 'string', example: 'Carla Montaño' },
    role: { type: 'string', enum: Object.values(AUDIT_ACTOR_ROLE) },
  },
};

const AUDIT_EVIDENCE_SCHEMA = {
  type: 'object',
  nullable: true,
  properties: {
    name: { type: 'string', example: 'titulo' },
    extension: { type: 'string', example: 'pdf' },
    mimeType: { type: 'string', example: 'application/pdf' },
    size: { type: 'integer', example: 245760 },
  },
};

export const AUDIT_EVENT_LIST_OK_RESPONSE = {
  description: 'Listado paginado de eventos de auditoría filtrados.',
  schema: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                code: { type: 'string', example: 'EVT-2026-000124' },
                occurredAt: { type: 'string', format: 'date-time' },
                request: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    code: { type: 'string', example: 'SOL-2026-0001' },
                  },
                },
                applicantName: { type: 'string', example: 'Ana Gómez' },
                action: { type: 'string', enum: Object.values(AUDIT_ACTION) },
                responsible: AUDIT_RESPONSIBLE_SCHEMA,
                detail: { type: 'string', nullable: true, example: null },
                evidence: AUDIT_EVIDENCE_SCHEMA,
              },
            },
          },
          total: { type: 'integer', example: 42 },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
        },
      },
      page: { type: 'integer', example: 1 },
      offset: { type: 'integer', example: 0 },
    },
  },
};

export const AUDIT_EVENT_RESPONSIBLES_OK_RESPONSE = {
  description:
    'Catálogo de responsables disponibles para filtrar eventos de auditoría.',
  schema: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string', example: SYSTEM_RESPONSIBLE_ID },
        name: { type: 'string', example: 'Sistema' },
      },
    },
  },
};

export const AUDIT_EVENT_EXPORT_OK_RESPONSE = {
  description:
    'Archivo CSV codificado en UTF-8 con los eventos de auditoría filtrados.',
  schema: { type: 'string', format: 'binary' },
};

export const AUDIT_EVENT_DOCUMENT_OK_RESPONSE = {
  description:
    'Documento binario de evidencia histórica asociado al evento de auditoría.',
  schema: { type: 'string', format: 'binary' },
};

export const AUDIT_EVENT_DETAIL_OK_RESPONSE = {
  description:
    'Detalle completo del evento de auditoría con datos de la solicitud, solicitante, responsable y evidencia.',
  schema: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      code: { type: 'string', example: 'EVT-2026-000124' },
      occurredAt: { type: 'string', format: 'date-time' },
      action: { type: 'string', enum: Object.values(AUDIT_ACTION) },
      request: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string', example: 'SOL-2026-0001' },
        },
      },
      applicant: {
        type: 'object',
        properties: {
          fullName: { type: 'string', example: 'Ana Gómez' },
          career: { type: 'string', example: 'Ingeniería de Sistemas' },
          graduationYear: { type: 'integer', example: 2024 },
        },
      },
      responsible: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', nullable: true },
          name: { type: 'string', example: 'Carla Montaño' },
          role: { type: 'string', enum: Object.values(AUDIT_ACTOR_ROLE) },
        },
      },
      rejectionReason: { type: 'string', nullable: true, example: null },
      documentType: {
        type: 'string',
        nullable: true,
        example: 'Título Profesional',
      },
      evidence: {
        type: 'object',
        nullable: true,
        properties: {
          name: { type: 'string', example: 'titulo' },
          extension: { type: 'string', example: 'pdf' },
          mimeType: { type: 'string', example: 'application/pdf' },
          size: { type: 'integer', example: 245760 },
        },
      },
    },
  },
};

export const AUDIT_EVENT_TIMELINE_OK_RESPONSE = {
  description:
    'Línea de tiempo cronológica de eventos asociados a la misma solicitud de acceso.',
  schema: {
    type: 'object',
    properties: {
      requestCode: { type: 'string', example: 'SOL-2026-0001' },
      focusedEventId: { type: 'string', format: 'uuid' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            action: { type: 'string', enum: Object.values(AUDIT_ACTION) },
            occurredAt: { type: 'string', format: 'date-time' },
            actorName: { type: 'string', example: 'Sistema' },
            actorRole: {
              type: 'string',
              enum: Object.values(AUDIT_ACTOR_ROLE),
            },
            detail: { type: 'string', nullable: true, example: null },
          },
        },
      },
    },
  },
};
