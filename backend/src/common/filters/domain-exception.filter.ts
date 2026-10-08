import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { DomainException } from '../exceptions/domain.exception.js';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    // Se registra el codigo tecnico internamente para auditoria
    // logger.error(`[DomainException ${exception.code ?? 'UNKNOWN'}] ${exception.message}`);

    response.status(exception.statusCode).json({
      statusCode: exception.statusCode,
      data: exception.data,
      detail: exception.message,
      ok: false,
    });
  }
}
//import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
//import type { Response } from 'express';
//import { DomainException } from '../exceptions/domain.exception.js';

//@Catch(DomainException)
//export class DomainExceptionFilter implements ExceptionFilter {
  //catch(exception: DomainException, host: ArgumentsHost): void {
    //const response = host.switchToHttp().getResponse<Response>();

    //response.status(exception.statusCode).json({
      //statusCode: exception.statusCode,
      //data: null,
      //detail: exception.message,
      //ok: false,
   // });
//  }
//}

