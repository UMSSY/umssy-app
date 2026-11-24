import type { OpenAPIObject } from '@nestjs/swagger';
import { API_ERROR_SCHEMA } from '../constants/api-error-swagger.constants.js';
import { HTTP_ERRORS } from '../constants/http-errors.constants.js';

export function documentCommonResponses(
  document: OpenAPIObject,
): OpenAPIObject {
  const methods = [
    'get',
    'put',
    'post',
    'delete',
    'options',
    'head',
    'patch',
    'trace',
  ] as const;
  document.components ??= {};
  document.components.schemas ??= {};
  document.components.schemas.ApiErrorResponse ??= API_ERROR_SCHEMA;

  for (const path of Object.values(document.paths)) {
    if (!path) continue;
    for (const method of methods) {
      const operation = path[method];
      if (!operation) continue;
      operation.responses ??= {};
      const statuses = [500];
      const security = operation.security ?? document.security ?? [];
      if (security.some((requirement) => Object.keys(requirement).length > 0))
        statuses.push(401);
      const roles: unknown = (
        operation as typeof operation & {
          'x-required-roles'?: unknown;
        }
      )['x-required-roles'];
      if (Array.isArray(roles) && roles.length > 0) statuses.push(403);
      for (const status of statuses) {
        if (operation.responses[status]) continue;
        const error =
          status === 403
            ? {
                code: 'FORBIDDEN_ROLE',
                detail: 'No tienes el rol necesario para este recurso',
              }
            : HTTP_ERRORS[status];
        operation.responses[status] = {
          description: error.detail,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiErrorResponse' },
              example: { statusCode: status, ok: false, ...error, data: null },
            },
          },
        };
      }
    }
  }
  return document;
}
