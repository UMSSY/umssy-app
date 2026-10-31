import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BEARER_PREFIX } from '../../../common/constants/auth.constants.js';
import { DOCUMENT_CORRECTION_TOKEN_PATTERN } from '../constants/document-correction.constants.js';
import { DocumentCorrectionUnauthorizedException } from '../exceptions/document-correction-unauthorized.exception.js';
import { createDocumentCorrectionToken, matchesDocumentCorrectionToken } from '../helpers/document-correction-token.js';
import { DocumentCorrectionRepository } from '../repositories/document-correction.repository.js';
import { requestStatusParamsSchema } from '../requests/request-status.schema.js';
import { ACCESS_REQUEST_STATUS } from '../types/access-request.enum.js';
import type {
  DocumentCorrectionContext,
  DocumentCorrectionGrant,
  DocumentCorrectionSnapshot,
} from '../types/document-correction.types.js';

@Injectable()
export class DocumentCorrectionAuthorizationService {
  constructor(
    private readonly repository: DocumentCorrectionRepository,
    private readonly config: ConfigService,
  ) {}

  // API interna para B3. No se expone un endpoint que entregue permisos por
  // conocer solamente el código SOL o el correo de una persona.
  async issueFor(accessRequestId: string): Promise<DocumentCorrectionGrant> {
    const context = this.getContext(await this.repository.findById(accessRequestId));
    return { requestCode: context.requestCode, token: createDocumentCorrectionToken(context, this.getSecret()) };
  }

  async authorize(code: unknown, authorization: unknown): Promise<DocumentCorrectionContext> {
    const parsed = requestStatusParamsSchema.safeParse({ code });
    if (!parsed.success || typeof authorization !== 'string' || !authorization.startsWith(BEARER_PREFIX)) {
      throw new DocumentCorrectionUnauthorizedException();
    }

    const token = authorization.slice(BEARER_PREFIX.length).trim();
    if (!DOCUMENT_CORRECTION_TOKEN_PATTERN.test(token)) throw new DocumentCorrectionUnauthorizedException();
    const source = await this.repository.findByCode(parsed.data.code);
    const context = this.getContext(source);
    if (context.requestCode !== parsed.data.code || !matchesDocumentCorrectionToken(context, token, this.getSecret())) {
      throw new DocumentCorrectionUnauthorizedException();
    }
    return context;
  }

  private getContext(source: DocumentCorrectionSnapshot | null): DocumentCorrectionContext {
    if (
      !source || source.status.title !== ACCESS_REQUEST_STATUS.REJECTED || !source.requestCode ||
      !(source.updatedAt instanceof Date) || !Number.isFinite(source.updatedAt.getTime())
    ) {
      throw new DocumentCorrectionUnauthorizedException();
    }
    return {
      accessRequestId: source.id,
      requestCode: source.requestCode,
      previousFileId: source.documentFileId,
      revision: source.updatedAt,
    };
  }

  private getSecret(): string {
    const secret = this.config.get<string>('JWT_SECRET');
    if (typeof secret !== 'string' || !secret.trim()) throw new DocumentCorrectionUnauthorizedException();
    return secret;
  }
}
