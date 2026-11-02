import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { AttachmentTooLargeException } from '../exceptions/attachment-too-large.exception.js';

@Injectable()
export class AttachmentUploadInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error: unknown) =>
        throwError(() =>
          error instanceof PayloadTooLargeException
            ? new AttachmentTooLargeException('El archivo supera el tamaño maximo permitido')
            : error,
        ),
      ),
    );
  }
}
