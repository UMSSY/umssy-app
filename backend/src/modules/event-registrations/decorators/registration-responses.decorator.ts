import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { REGISTRATION_ERRORS } from '../constants/registration-errors.constants.js';

export const RegistrationResponses = (status: 200 | 201) => {
  const statuses = [...new Set(Object.values(REGISTRATION_ERRORS).map((error) => error.statusCode))];
  return applyDecorators(
    ApiResponse({
      status,
      description: 'Operación exitosa',
      schema: {
        type: 'object',
        required: ['statusCode', 'ok', 'detail', 'data'],
        properties: {
          statusCode: { type: 'integer', enum: [status] },
          ok: { type: 'boolean', enum: [true] },
          detail: { type: 'string', example: 'Operación exitosa' },
          data: {
            type: 'object',
            required: ['id', 'eventId', 'status', 'qrToken', 'registeredAt', 'cancelledAt'],
            properties: {
              id: { type: 'string', format: 'uuid' },
              eventId: { type: 'string', format: 'uuid' },
              status: { type: 'string', enum: ['confirmed', 'cancelled'] },
              qrToken: { type: 'string' },
              registeredAt: { type: 'string', format: 'date-time' },
              cancelledAt: { type: 'string', format: 'date-time', nullable: true },
            },
          },
        },
      },
    }),
    ...statuses.map((statusCode) => ApiResponse({
      status: statusCode,
      description: Object.entries(REGISTRATION_ERRORS)
        .filter(([, error]) => error.statusCode === statusCode)
        .map(([code, error]) => `${code}: ${error.detail}`).join(' '),
      schema: {
        type: 'object',
        required: ['statusCode', 'ok', 'code', 'detail', 'data'],
        properties: {
          statusCode: { type: 'integer', enum: [statusCode] },
          ok: { type: 'boolean', enum: [false] },
          code: { type: 'string', enum: Object.entries(REGISTRATION_ERRORS).filter(([, error]) => error.statusCode === statusCode).map(([code]) => code) },
          detail: { type: 'string' },
          data: { type: 'object', nullable: true, enum: [null] },
        },
      },
    })),
  );
};
