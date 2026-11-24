import { AUDIT_ACTION } from '../types/audit-action.enum.js';
import { AUDIT_ACTOR_ROLE } from '../types/audit-actor-role.enum.js';

export const AUDIT_EVENT_ID_PARAM = {
  name: 'id',
  required: true,
  description: 'Identificador UUID del evento de auditoría.',
  schema: { type: 'string', format: 'uuid' },
  example: '550e8400-e29b-41d4-a716-446655440000',
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
