import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CompanyDocumentCorrectionAuthorizationService } from '../services/company-document-correction-authorization.service.js';
import type { CompanyDocumentCorrectionRequest } from '../types/company-document-correction.types.js';

@Injectable()
export class CompanyDocumentCorrectionGuard implements CanActivate {
  constructor(
    private readonly authorization: CompanyDocumentCorrectionAuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<CompanyDocumentCorrectionRequest>();
    delete request.companyDocumentCorrection;
    request.companyDocumentCorrection = await this.authorization.authorize(
      request.params.code,
      request.headers.authorization,
    );
    return true;
  }
}
