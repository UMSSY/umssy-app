import {
  Injectable,
  StreamableFile,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, type Observable } from 'rxjs';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator.js';
import type { ApiResponse } from '../types/api-response.types.js';

const DEFAULT_DETAIL = 'Solicitud procesada correctamente';

function getPage(data: unknown): number | undefined {
  if (typeof data === 'object' && data !== null && 'page' in data) {
    const { page } = data as { page: unknown };
    return typeof page === 'number' ? page : undefined;
  }
  return undefined;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | StreamableFile
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | StreamableFile> {
    const detail =
      this.reflector.get<string | undefined>(
        RESPONSE_MESSAGE_KEY,
        context.getHandler(),
      ) ?? DEFAULT_DETAIL;
    const { statusCode } = context
      .switchToHttp()
      .getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      map((data) => {
        if (data instanceof StreamableFile) {
          return data;
        }

        const page = getPage(data);
        return {
          statusCode,
          data,
          ...(page !== undefined && { page }),
          detail,
          ok: true,
        };
      }),
    );
  }
}
