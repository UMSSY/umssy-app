import type { SchemaObject } from '@nestjs/swagger';
export const MENTOR_PHOTO_ERROR_SCHEMA: SchemaObject = {
  type: 'object',
  required: ['statusCode', 'ok', 'code', 'detail', 'data'],
  properties: {
    statusCode: { type: 'integer', enum: [400, 404, 500] },
    ok: { type: 'boolean', enum: [false] },
    code: {
      type: 'string',
      enum: [
        'VALIDATION_ERROR',
        'MENTOR_NOT_FOUND',
        'PROFILE_NOT_FOUND',
        'PHOTO_NOT_FOUND',
        'INTERNAL_ERROR',
      ],
    },
    detail: { type: 'string' },
    data: { type: 'object', nullable: true },
  },
};
