import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { z } from 'zod';
import type { RadarOpenApiSchema } from '../types/radar-open-api-schema.types.js';
import { AREA_IDS } from './radar-scoring.js';
import type { RadarEndpointOptions } from '../types/radar-endpoint-options.types.js';
import { getRadarSchemaExample } from './get-radar-schema-example.js';
import { HTTP_ERRORS } from '../../../common/constants/http-errors.constants.js';

export function documentRadarEndpoint(options: RadarEndpointOptions) {
  const status = options.status ?? 200;
  const decorators = [
    ApiOperation({
      operationId: options.operationId,
      summary: options.summary,
      description: options.description,
    }),
  ];
  if (options.binary) {
    decorators.push(
      ApiResponse({
        status,
        description:
          'Archivo autorizado. Se envía directamente, sin envoltura JSON.',
        content: {
          [options.mime ?? 'application/pdf']: {
            schema: { type: 'string', format: 'binary' },
          },
        },
        headers: {
          'Content-Disposition': {
            description: 'Vista previa en el navegador.',
            schema: { type: 'string', example: 'inline' },
          },
        },
      }),
    );
  } else if (options.response) {
    const envelope = z.object({
      statusCode: z.literal(status),
      data: options.response,
      detail: z.string(),
      ok: z.literal(true),
    });
    const schema = z.toJSONSchema(envelope, { target: 'openapi-3.0' });
    decorators.push(
      ApiResponse({
        status,
        description:
          'Operación completada. Las listas se devuelven completas, sin paginación.',
        content: {
          'application/json': {
            schema: schema as RadarOpenApiSchema,
            example: getRadarSchemaExample(schema),
          },
        },
      }),
    );
  }
  const descriptions: Record<number, string> = {
    400: 'Identificador, parámetros o cuerpo inválidos.',
    401: 'Sesión ausente o expirada.',
    403: 'Rol, consentimiento o acceso a empresa insuficiente.',
    404: 'Recurso inexistente o no disponible para esta sesión.',
    409: 'La versión o el estado actual impide completar la operación.',
    500: 'Error interno del servicio.',
  };
  for (const code of new Set([401, 500, ...(options.errors ?? [])])) {
    decorators.push(
      ApiResponse({
        status: code,
        description: descriptions[code],
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiErrorResponse' },
            example: {
              statusCode: code,
              ok: false,
              ...HTTP_ERRORS[code],
              data: null,
            },
          },
        },
      }),
    );
  }
  for (const name of options.parameters ?? []) {
    decorators.push(
      ApiParam({
        name,
        required: true,
        schema:
          name === 'kind'
            ? { type: 'string', enum: ['cv', 'skill'] }
            : name === 'areaId'
              ? { type: 'string', enum: [...AREA_IDS] }
              : { type: 'string', format: 'uuid' },
        description:
          name === 'areaId'
            ? 'Eje técnico del radar.'
            : name === 'kind'
              ? 'Tipo de evidencia.'
              : 'Identificador UUID del recurso.',
      }),
    );
  }
  return applyDecorators(...decorators);
}
