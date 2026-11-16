import { ApiResponse, type ApiResponseOptions } from '@nestjs/swagger';
import { SUCCESS_DETAIL } from '../constants/api-errors.constants.js';
import {
  apiBoolean,
  apiExampleOf,
  apiInteger,
  apiString,
  type ApiSchema,
} from '../utils/api-schema.js';

interface ApiSuccessResponseOptions {
  status: number;
  description: string;
  data: ApiSchema;
  detail?: string;
}

export function apiSuccessResponse({
  status,
  description,
  data,
  detail = SUCCESS_DETAIL,
}: ApiSuccessResponseOptions) {
  return ApiResponse({
    status,
    description,
    schema: {
      type: 'object',
      required: ['statusCode', 'ok', 'detail', 'data'],
      properties: {
        statusCode: apiInteger(status),
        ok: apiBoolean(true),
        detail: apiString(detail),
        data,
      },
      example: {
        statusCode: status,
        ok: true,
        detail,
        data: apiExampleOf(data),
      },
    },
  } as ApiResponseOptions);
}
