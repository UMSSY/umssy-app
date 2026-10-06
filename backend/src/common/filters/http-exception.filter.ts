// TODO: Migrar las excepciones HTTP restantes a DomainException antes de retirar este filtro.
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse();

    const detail =
      typeof body === 'string'
        ? body
        : typeof body === 'object' && body !== null && 'message' in body
          ? String((body as Record<string, unknown>).message)
          : 'Error en la solicitud';

    response.status(status).json({
      statusCode: status,
      ok: false,
      detail,
      data: null,
    });
  }
}
