import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BEARER_PREFIX } from '../../../common/constants/auth.constants.js';
import {
  COMPANY_CORRECTION_STATUSES,
  COMPANY_CORRECTION_TOKEN_PATTERN,
} from '../constants/company-document-correction.constants.js';
import { CompanyDocumentCorrectionUnauthorizedException } from '../exceptions/company-document-correction-unauthorized.exception.js';
import {
  createCompanyCorrectionToken,
  matchesCompanyCorrectionToken,
} from '../helpers/company-document-correction-token.js';
import { CompanyAccessRequestsRepository } from '../repositories/company-access-requests.repository.js';
import { companyRequestCodeParamsSchema } from '../requests/company-request-code.schema.js';
import type {
  CompanyDocumentCorrectionContext,
  CompanyDocumentCorrectionSnapshot,
} from '../types/company-document-correction.types.js';

@Injectable()
export class CompanyDocumentCorrectionAuthorizationService {
  constructor(
    private readonly repository: CompanyAccessRequestsRepository,
    private readonly config: ConfigService,
  ) {}

  issueFor(source: CompanyDocumentCorrectionSnapshot): string {
    return createCompanyCorrectionToken(
      this.toContext(source),
      this.getSecret(),
    );
  }

  async authorize(
    code: unknown,
    authorization: unknown,
  ): Promise<CompanyDocumentCorrectionContext> {
    const parsed = companyRequestCodeParamsSchema.safeParse({ code });
    if (
      !parsed.success ||
      typeof authorization !== 'string' ||
      !authorization.startsWith(BEARER_PREFIX)
    ) {
      throw new CompanyDocumentCorrectionUnauthorizedException();
    }

    const token = authorization.slice(BEARER_PREFIX.length).trim();
    if (!COMPANY_CORRECTION_TOKEN_PATTERN.test(token)) {
      throw new CompanyDocumentCorrectionUnauthorizedException();
    }

    const source = await this.repository.findCorrectionSnapshotByCode(
      parsed.data.code,
    );
    const context = this.toContext(source);
    if (
      context.requestCode !== parsed.data.code ||
      !matchesCompanyCorrectionToken(context, token, this.getSecret())
    ) {
      throw new CompanyDocumentCorrectionUnauthorizedException();
    }
    return context;
  }

  private toContext(
    source: CompanyDocumentCorrectionSnapshot | null,
  ): CompanyDocumentCorrectionContext {
    if (
      !source ||
      !(COMPANY_CORRECTION_STATUSES as readonly string[]).includes(
        source.status.title,
      ) ||
      !source.requestCode ||
      !(source.reviewedAt instanceof Date) ||
      !Number.isFinite(source.reviewedAt.getTime())
    ) {
      throw new CompanyDocumentCorrectionUnauthorizedException();
    }
    return {
      requestId: source.id,
      requestCode: source.requestCode,
      previousFileId: source.documentFileId,
      revision: source.reviewedAt,
    };
  }

  private getSecret(): string {
    const secret = this.config.get<string>('JWT_SECRET');
    if (typeof secret !== 'string' || !secret.trim()) {
      throw new CompanyDocumentCorrectionUnauthorizedException();
    }
    return secret;
  }
}
