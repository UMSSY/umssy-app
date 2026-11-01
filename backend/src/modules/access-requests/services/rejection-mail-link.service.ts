import { Injectable } from '@nestjs/common';
import { BEARER_PREFIX } from '../../../common/constants/auth.constants.js';
import { RejectionMailContextException } from '../exceptions/rejection-mail-context.exception.js';
import { buildRejectionUrl } from '../mail/helpers/rejection-url.js';
import { RejectionMailContextService } from '../mail/rejection-mail-context.service.js';
import { RejectionMailRepository } from '../repositories/rejection-mail.repository.js';
import type { RejectionMailLink } from '../types/rejection-mail.types.js';
import { DocumentCorrectionAuthorizationService } from './document-correction-authorization.service.js';

@Injectable()
export class RejectionMailLinkService {
  constructor(
    private readonly context: RejectionMailContextService,
    private readonly repository: RejectionMailRepository,
    private readonly authorization: DocumentCorrectionAuthorizationService,
  ) {}

  async forRecipient(to: string, reason: string): Promise<RejectionMailLink> {
    const context = this.context.getCurrent();
    if (!context?.accessRequestId || !reason.trim()) throw new RejectionMailContextException();

    const source = await this.repository.findById(context.accessRequestId);
    if (
      !source || source.email.trim().toLowerCase() !== to.trim().toLowerCase() ||
      source.rejectionReason !== reason || !(source.updatedAt instanceof Date) ||
      !Number.isFinite(source.updatedAt.getTime())
    ) {
      throw new RejectionMailContextException();
    }

    const grant = await this.authorization.issueFor(context.accessRequestId);
    const authorized = await this.authorization.authorize(grant.requestCode, `${BEARER_PREFIX}${grant.token}`);
    // Impide enviar un permiso de una revisión posterior con el motivo anterior.
    if (
      authorized.accessRequestId !== context.accessRequestId ||
      authorized.requestCode !== grant.requestCode ||
      authorized.revision.getTime() !== source.updatedAt.getTime()
    ) {
      throw new RejectionMailContextException();
    }
    return { requestCode: grant.requestCode, url: buildRejectionUrl(grant) };
  }
}
