import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

const registration = {
  type: 'object',
  required: ['id', 'eventId', 'eventName', 'date', 'startTime', 'endTime', 'location', 'status', 'registeredAt', 'cancelledAt'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    eventId: { type: 'string', format: 'uuid' },
    eventName: { type: 'string' },
    date: { type: 'string', format: 'date-time' },
    startTime: { type: 'string', format: 'date-time' },
    endTime: { type: 'string', format: 'date-time' },
    location: { type: 'string' },
    status: { type: 'string' },
    registeredAt: { type: 'string', format: 'date-time' },
    cancelledAt: { type: 'string', format: 'date-time', nullable: true },
  },
};

const exampleItem = {
  id: '7b8988fd-6818-4929-858b-4d83b72873cf',
  eventId: '33333333-3333-4333-8333-333333333333',
  eventName: 'Taller de NestJS',
  date: '2026-11-16T00:00:00.000Z',
  startTime: '1970-01-01T10:00:00.000Z',
  endTime: '1970-01-01T11:00:00.000Z',
  location: 'Aula D-101',
  status: 'Confirmada',
  registeredAt: '2026-11-10T14:00:00.000Z',
  cancelledAt: null,
};

export const MyRegistrationsResponses = () => applyDecorators(
  ApiResponse({
    status: 200,
    description: 'Sin scope: arreglo de pases activos. Con scope=finished: página de talleres finalizados.',
    content: { 'application/json': {
      schema: { oneOf: [
        { type: 'object', required: ['statusCode', 'ok', 'detail', 'data'], properties: {
          statusCode: { type: 'integer', enum: [200] }, ok: { type: 'boolean', enum: [true] }, detail: { type: 'string' }, data: { type: 'array', items: registration },
        } },
        { type: 'object', required: ['statusCode', 'ok', 'detail', 'data', 'page', 'offset'], properties: {
          statusCode: { type: 'integer', enum: [200] }, ok: { type: 'boolean', enum: [true] }, detail: { type: 'string' }, page: { type: 'integer', minimum: 1 }, offset: { type: 'integer', minimum: 0 },
          data: { type: 'object', required: ['items', 'total', 'limit', 'totalPages'], properties: {
            items: { type: 'array', items: registration }, total: { type: 'integer', minimum: 0 }, limit: { type: 'integer', minimum: 1, maximum: 50 }, totalPages: { type: 'integer', minimum: 0 },
          } },
        } },
      ] },
      examples: {
        current: { summary: 'Pases activos', value: { statusCode: 200, ok: true, detail: 'Operación exitosa', data: [exampleItem] } },
        finished: { summary: 'Historial paginado', value: { statusCode: 200, ok: true, detail: 'Operación exitosa', data: { items: [exampleItem], total: 1, limit: 10, totalPages: 1 }, page: 1, offset: 0 } },
      },
    } },
    headers: { 'Cache-Control': { description: 'Respuesta privada sin caché', schema: { type: 'string', example: 'private, no-store' } } },
  }),
  ApiResponse({ status: 400, description: 'Parámetros de consulta inválidos', schema: { $ref: '#/components/schemas/ApiErrorResponse' }, example: { statusCode: 400, ok: false, code: 'VALIDATION_ERROR', detail: 'Parámetros de consulta inválidos.', data: null } }),
  ApiResponse({ status: 401, description: 'Se requiere una sesión válida', schema: { $ref: '#/components/schemas/ApiErrorResponse' }, example: { statusCode: 401, ok: false, code: 'UNAUTHENTICATED', detail: 'Se requiere una sesión válida.', data: null } }),
);
