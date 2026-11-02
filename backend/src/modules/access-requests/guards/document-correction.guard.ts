import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { DocumentCorrectionAuthorizationService } from '../services/document-correction-authorization.service.js';
import type { DocumentCorrectionRequest } from '../types/document-correction-request.types.js';

@Injectable()
export class DocumentCorrectionGuard implements CanActivate {
  constructor(private readonly authorization: DocumentCorrectionAuthorizationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<DocumentCorrectionRequest>();
    delete request.documentCorrection;
    request.documentCorrection = await this.authorization.authorize(request.params.code, request.headers.authorization);
    return true;
  }
}
