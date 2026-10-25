import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { RequestValidationException } from '../exceptions/request-validation.exception.js';
import { DomainException } from '../exceptions/domain.exception.js';
import { HTTP_ERRORS } from '../constants/http-errors.constants.js';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (!(exception instanceof DomainException)) {
      const statusCode = exception instanceof HttpException ? exception.getStatus() : 500;
      const error = HTTP_ERRORS[statusCode] ?? {
        code: statusCode >= 500 ? 'INTERNAL_ERROR' : 'HTTP_ERROR',
        detail: statusCode >= 500 ? HTTP_ERRORS[500].detail : 'No se pudo completar la solicitud.',
      };
      if (statusCode >= 500) {
        this.logger.error(exception instanceof Error ? exception.stack : 'Unexpected request failure');
      }
      response.status(statusCode).json({ statusCode, ok: false, ...error, data: null });
      return;
    }

    response.status(exception.statusCode).json({
      statusCode: exception.statusCode,
      code: exception.code,
      data: exception.data,
      detail: exception.message,
      ok: false,
      ...(exception instanceof RequestValidationException && {
        errors: exception.errors,
      }),
    });
  }
}
