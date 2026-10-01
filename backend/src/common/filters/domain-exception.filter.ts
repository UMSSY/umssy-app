import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { DomainException } from '../exceptions/domain.exception.js';

// Convierte las excepciones de negocio al contrato estandar de respuesta.
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    response.status(exception.statusCode).json({
      statusCode: exception.statusCode,
      data: null,
      detail: exception.message,
      ok: false,
    });
  }
}
