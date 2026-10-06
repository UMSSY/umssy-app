import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import type { PaginatedPayload } from '../types/paginated-payload.types.js';

import type { AlreadyFormatted } from '../types/already-formatted.types.js';

function isPaginatedPayload(value: unknown): value is PaginatedPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'page' in value &&
    'offset' in value
  );
}

function isAlreadyFormatted(value: unknown): value is AlreadyFormatted {
  return (
    typeof value === 'object' &&
    value !== null &&
    'statusCode' in value &&
    'ok' in value &&
    'detail' in value &&
    'data' in value
  );
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const statusCode = _context
      .switchToHttp()
      .getResponse<{ statusCode: number }>().statusCode;

    return next.handle().pipe(
      map((value: unknown) => {
        if (isAlreadyFormatted(value)) {
          return value;
        }

        if (isPaginatedPayload(value)) {
          return {
            statusCode,
            ok: true,
            detail: 'Operación exitosa',
            data: value.data,
            page: value.page,
            offset: value.offset,
          };
        }

        return {
          statusCode,
          ok: true,
          detail: 'Operación exitosa',
          data: value,
        };
      }),
    );
  }
}
