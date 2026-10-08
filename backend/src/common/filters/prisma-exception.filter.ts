//captura los errores de Prisma y los convierte en 500
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch(HttpException)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    // Mapear BadRequestException con detalles de Zod a 422
    if (
      status === 400 &&
      exceptionResponse?.error === 'VALIDATION_ERROR' &&
      Array.isArray(exceptionResponse.detalles)
    ) {
      response.status(422).json({
        statusCode: 422,
        data: null,
        detail: exceptionResponse.detalles,
        ok: false,
      });
      return;
    }

    // Otros errores HTTP (401, 403, 404, etc.)
    response.status(status).json({
      statusCode: status,
      data: null,
      detail: exceptionResponse?.message || 'Error inesperado.',
      ok: false,
    });
  }
}