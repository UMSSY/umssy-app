import { CallHandler, ExecutionContext, Injectable, NestInterceptor, PayloadTooLargeException } from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { FileTooLargeException } from '../../files/exceptions/index.js';

// Multer lanza PayloadTooLargeException al pasar limits.fileSize. Se traduce aquí, local al módulo,
// a una excepción de dominio para que salga con el formato estándar y un mensaje en español.
// Debe declararse antes que FileInterceptor para envolver el error de Multer.
@Injectable()
export class DocumentUploadInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error: unknown) =>
        throwError(() => (error instanceof PayloadTooLargeException ? new FileTooLargeException() : error)),
      ),
    );
  }
}
