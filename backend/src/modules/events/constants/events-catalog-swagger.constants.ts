import type { ApiResponseOptions, SchemaObject } from '@nestjs/swagger';

const sessionSchema: SchemaObject = {
  type: 'object',
  required: ['id', 'startsAt', 'endsAt', 'location'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    startsAt: { type: 'string', format: 'date-time' },
    endsAt: { type: 'string', format: 'date-time' },
    location: { type: 'string', nullable: true },
  },
};

const eventSchema: SchemaObject = {
  type: 'object',
  required: [
    'id',
    'title',
    'description',
    'eventDate',
    'startTime',
    'endTime',
    'location',
    'sessions',
    'capacity',
    'availableSpots',
    'registrationCount',
    'instructorName',
    'modalityId',
    'category',
    'statusId',
    'status',
    'origin',
    'supportCount',
    'supportThreshold',
    'supportsRemaining',
    'progressPercent',
    'votingDeadline',
    'hasSupported',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string', example: 'Introducción a ciencia de datos' },
    description: { type: 'string', nullable: true },
    eventDate: { type: 'string', format: 'date' },
    startTime: { type: 'string', example: '18:00' },
    endTime: { type: 'string', example: '20:00' },
    location: { type: 'string', nullable: true },
    sessions: { type: 'array', items: sessionSchema },
    capacity: { type: 'integer', nullable: true },
    availableSpots: { type: 'integer', nullable: true },
    registrationCount: { type: 'integer' },
    instructorName: { type: 'string', nullable: true },
    modalityId: { type: 'string', format: 'uuid', nullable: true },
    category: {
      type: 'object',
      required: ['id', 'name'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
      },
    },
    statusId: { type: 'string', format: 'uuid' },
    status: { type: 'string' },
    origin: { type: 'string' },
    supportCount: { type: 'integer' },
    supportThreshold: { type: 'integer', nullable: true },
    supportsRemaining: { type: 'integer', nullable: true },
    progressPercent: { type: 'number', nullable: true },
    votingDeadline: { type: 'string', format: 'date-time', nullable: true },
    hasSupported: { type: 'boolean' },
    coverUrl: { type: 'string', nullable: true },
    recommendation: {
      type: 'object',
      required: ['score', 'reasons'],
      properties: {
        score: { type: 'number' },
        reasons: { type: 'array', items: { type: 'string' } },
      },
    },
  },
};

export const EVENTS_LIST_RESPONSE: ApiResponseOptions = {
  status: 200,
  description:
    'Lista paginada. recommended sin sesión usa el orden por fecha; con perfil incompleto usa popular y devuelve isProfileComplete=false.',
  schema: {
    type: 'object',
    required: ['statusCode', 'ok', 'detail', 'data', 'page', 'offset'],
    properties: {
      statusCode: { type: 'integer', example: 200 },
      ok: { type: 'boolean', example: true },
      detail: { type: 'string', example: 'Operación exitosa' },
      page: { type: 'integer', example: 1 },
      offset: { type: 'integer', example: 0 },
      data: {
        type: 'object',
        required: ['items', 'total', 'limit', 'totalPages'],
        properties: {
          items: { type: 'array', items: eventSchema },
          total: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          totalPages: { type: 'integer', example: 1 },
          isProfileComplete: {
            type: 'boolean',
            description: 'Solo aparece con recommended y sesión.',
          },
        },
      },
    },
  },
};
