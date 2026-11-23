import type { ApiBodyOptions, ApiResponseOptions } from '@nestjs/swagger';
import { MAX_EVENT_SESSIONS } from './events.constants.js';

export const EVENT_PROPOSAL_BODY: ApiBodyOptions = {
  description:
    'Formulario multipart. additionalSessions es una cadena JSON con un arreglo de hasta 19 sesiones adicionales; la sesión principal se envía en eventDate, startTime y endTime.',
  schema: {
    type: 'object',
    required: [
      'title',
      'description',
      'categoryId',
      'eventDate',
      'startTime',
      'endTime',
      'capacity',
      'modality',
      'location',
      'cover',
    ],
    properties: {
      title: { type: 'string', maxLength: 80 },
      description: { type: 'string', maxLength: 300 },
      categoryId: { type: 'string', format: 'uuid' },
      eventDate: { type: 'string', format: 'date', example: '2026-12-03' },
      startTime: {
        type: 'string',
        pattern: '^([01]\\d|2[0-3]):[0-5]\\d$',
        example: '18:00',
      },
      endTime: {
        type: 'string',
        pattern: '^([01]\\d|2[0-3]):[0-5]\\d$',
        example: '20:00',
      },
      capacity: {
        type: 'string',
        pattern: '^\\d+$',
        description: 'Entre 20 y 60 cupos.',
        example: '20',
      },
      modality: { type: 'string', enum: ['presencial', 'virtual'] },
      location: { type: 'string', maxLength: 150 },
      cover: {
        type: 'string',
        format: 'binary',
        description: 'JPG o PNG de hasta 5 MiB.',
      },
      additionalSessions: {
        type: 'string',
        description: `Texto JSON que representa un arreglo de 0 a ${MAX_EVENT_SESSIONS - 1} objetos. Cada objeto requiere eventDate (AAAA-MM-DD), startTime y endTime (HH:mm, fin posterior al inicio); location es opcional, máximo 300 caracteres antes de aplicar la validación de modalidad. Las sesiones no se superponen.`,
        example:
          '[{"eventDate":"2026-12-04","startTime":"18:00","endTime":"20:00","location":"Aula B-12"}]',
      },
    },
  },
};

export const EVENT_PROPOSAL_CREATED: ApiResponseOptions = {
  status: 201,
  description:
    'Propuesta creada o reintento idempotente de la misma propuesta.',
  schema: {
    type: 'object',
    required: ['statusCode', 'ok', 'detail', 'data'],
    properties: {
      statusCode: { type: 'integer', example: 201 },
      ok: { type: 'boolean', example: true },
      detail: { type: 'string', example: 'Operación exitosa' },
      data: {
        type: 'object',
        required: [
          'id',
          'status',
          'supportThreshold',
          'votingDeadline',
          'coverUrl',
        ],
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['voting'] },
          supportThreshold: { type: 'integer', example: 10 },
          votingDeadline: { type: 'string', format: 'date-time' },
          coverUrl: {
            type: 'string',
            example: '/events/33333333-3333-4333-8333-333333333333/cover',
          },
        },
      },
    },
  },
};

export const EVENT_PROPOSAL_ERRORS: ApiResponseOptions[] = [
  {
    status: 400,
    description: 'Formulario, sesiones o Idempotency-Key inválidos.',
  },
  { status: 401, description: 'Sesión requerida.' },
  {
    status: 403,
    description: 'Solo un titulado activo puede proponer talleres.',
  },
  {
    status: 409,
    description: 'La clave de idempotencia ya pertenece a otra propuesta.',
  },
  { status: 413, description: 'Archivo o formulario demasiado grande.' },
  { status: 415, description: 'Tipo de archivo no permitido.' },
  { status: 500, description: 'Error interno al guardar la propuesta.' },
].map((response) => ({
  ...response,
  schema: { $ref: '#/components/schemas/ApiErrorResponse' },
}));
