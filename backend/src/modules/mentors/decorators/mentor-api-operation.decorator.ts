import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { SchemaObject } from '@nestjs/swagger';
import type { MentorApiOperationOptions } from '../types/mentor-api-operation-options.types.js';

export function mentorApiOperation(options: MentorApiOperationOptions) {
  const status = options.status ?? 200;
  const errorStatuses = new Set([
    ...(options.auth ? [401, 403] : []),
    ...(options.errors ?? []),
    500,
  ]);
  const decorators = [
    ApiOperation({
      operationId: options.operationId,
      summary: options.summary,
      description: options.description,
    }),
    ApiResponse({
      status,
      description: 'Respuesta bajo el envoltorio JSON estándar.',
      schema: {
        type: 'object',
        required: ['statusCode', 'data', 'detail', 'ok'],
        properties: {
          statusCode: { type: 'integer', enum: [status] },
          ok: { type: 'boolean', enum: [true] },
          detail: {
            type: 'string',
            example:
              options.operationId === 'getMentorProfileSuggestions'
                ? 'OK'
                : 'Operación exitosa',
          },
          data: options.data,
        },
        example: {
          statusCode: status,
          ok: true,
          detail:
            options.operationId === 'getMentorProfileSuggestions'
              ? 'OK'
              : 'Operación exitosa',
          data: options.example,
        },
      },
    }),
  ];
  if (options.auth) decorators.push(ApiBearerAuth());
  for (const errorStatus of errorStatuses) {
    const code =
      errorStatus === 500
        ? 'INTERNAL_ERROR'
        : errorStatus === 429
          ? 'MENTOR_REQUEST_SUSPENDED'
          : errorStatus === 409
            ? options.operationId === 'leaveMentorParticipation'
              ? 'MENTOR_HAS_FUTURE_APPOINTMENTS'
              : options.operationId === 'confirmMentorSlotOffer'
                ? 'MENTOR_OFFER_ERROR'
                : 'IDEMPOTENCY_KEY_CONFLICT'
            : errorStatus === 404
              ? options.operationId.includes('MentorParticipationRequest')
                ? 'MENTOR_PARTICIPATION_ERROR'
                : options.operationId === 'confirmMentorSlotOffer'
                  ? 'MENTOR_OFFER_ERROR'
                  : options.operationId === 'activateMentor'
                    ? 'MENTOR_ROLE_NOT_FOUND'
                    : 'MENTOR_NOT_FOUND'
              : errorStatus === 401
                ? 'UNAUTHENTICATED'
                : errorStatus === 403
                  ? 'USER_INACTIVE'
                  : 'VALIDATION_ERROR';
    const schema: SchemaObject = {
      type: 'object',
      required: ['statusCode', 'ok', 'code', 'detail', 'data'],
      properties: {
        statusCode: { type: 'integer', enum: [errorStatus] },
        ok: { type: 'boolean', enum: [false] },
        code: { type: 'string', example: code },
        detail: { type: 'string' },
        data: {
          description:
            'Null o datos de la excepción de dominio (code, participationPath, agendaPath o sanctionEndsAt cuando corresponda).',
          oneOf: [
            { type: 'object', nullable: true, additionalProperties: true },
            {
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
          ],
        },
        errors: {
          type: 'array',
          items: { type: 'object', additionalProperties: true },
          description: 'Solo errores de validación Zod.',
        },
      },
    };
    decorators.push(
      ApiResponse({
        status: errorStatus,
        description:
          options.errorDescriptions?.[errorStatus] ??
          (errorStatus === 401
            ? 'Sesión ausente, inválida o sin roles válidos.'
            : errorStatus === 403
              ? 'Cuenta inactiva; se aplican además los permisos descritos en la operación.'
              : errorStatus === 500
                ? 'Error interno; no se convierte en una lista vacía.'
                : 'Validación o conflicto de dominio descrito en la operación.'),
        schema: {
          ...schema,
          example: {
            statusCode: errorStatus,
            ok: false,
            code,
            detail:
              errorStatus === 500
                ? 'Ocurrió un error interno al procesar la solicitud.'
                : 'No se pudo completar la solicitud.',
            data:
              errorStatus === 429
                ? { code, sanctionEndsAt: '2026-11-20T12:00:00.000Z' }
                : errorStatus === 409 && code === 'IDEMPOTENCY_KEY_CONFLICT'
                  ? { code }
                  : null,
          },
        },
        ...(errorStatus === 429
          ? {
              headers: {
                'Retry-After': {
                  description: 'Segundos restantes de sanción.',
                  schema: { type: 'integer', minimum: 0 },
                },
              },
            }
          : {}),
      }),
    );
  }
  return applyDecorators(...decorators);
}
