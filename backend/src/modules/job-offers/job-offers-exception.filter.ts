import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';

interface BusinessException extends Error {
  statusCode: number;
  code?: string;
}

@Catch()
export class JobOffersExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      // Mapea el error de validación del Pipe al código 422
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

      response.status(status).json({
        statusCode: status,
        data: null,
        detail: exceptionResponse?.message || 'Error inesperado.',
        ok: false,
      });
      return;
    }

    const businessException = exception as BusinessException;
    if (
      businessException instanceof Error &&
      typeof businessException.statusCode === 'number'
    ) {
      response.status(businessException.statusCode).json({
        statusCode: businessException.statusCode,
        data: null,
        detail: businessException.message,
        ok: false,
      });
      return;
    }

    // Cualquier otro error truena como 500
    console.error('Error interno del servidor:', exception);
    response.status(500).json({
      statusCode: 500,
      data: null,
      detail: 'Ocurrió un error inesperado en el servidor. Inténtelo más tarde.',
      ok: false,
    });
  }
}