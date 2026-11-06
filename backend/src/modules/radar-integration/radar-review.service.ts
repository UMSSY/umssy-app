import { CvSourcesService } from '../cv/services/cv-sources.service.js';
import { Injectable } from '@nestjs/common';
import { RadarReviewInvalidDecisionException } from './exceptions/radar-review-invalid-decision.exception.js';
import { RadarReviewInvalidEvidenceException } from './exceptions/radar-review-invalid-evidence.exception.js';
import { RadarReviewNotFoundException } from './exceptions/radar-review-not-found.exception.js';
import { RadarReviewRepository } from './repositories/radar-review.repository.js';
import { RadarAccessRepository } from './repositories/radar-access.repository.js';
import { ProfileSkillsAnalysisService } from '../nlp/services/profile-skills-analysis.service.js';
import { RadarPublicationService } from './radar-publication.service.js';
import { RadarReviewMapper } from './mappers/radar-review.mapper.js';

import { SkillAnalysisService } from '../skills/services/skill-analysis.service.js';
import { TransactionService } from '../../common/prisma/transaction.service.js';

@Injectable()
export class RadarReviewService {
  constructor(
    private readonly repository: RadarReviewRepository,
    private readonly access: RadarAccessRepository,
    private readonly nlp: ProfileSkillsAnalysisService,
    private readonly publication: RadarPublicationService,
    private readonly mapper: RadarReviewMapper,
    private readonly skills: SkillAnalysisService,
    private readonly transactions: TransactionService,
    private readonly cvs: CvSourcesService,
  ) {}
  private async audit(
    userId: string,
    actorId: string | null,
    event: string,
    targetId: string | null,
    details: object = {},
  ) {
    await this.access.recordAudit(userId, actorId, event, targetId, details);
  }
  async queue(_adminId: string) {
    return this.mapper.queue(
      await Promise.all([
        this.repository.listReviewQueue(),
        this.skills.listReviewQueue(),
      ]),
    );
  }
  async decision(adminId: string, kind: string, id: string, action: string) {
    if (!['approved', 'rejected', 'revoked'].includes(action))
      throw new RadarReviewInvalidDecisionException();
    if (kind !== 'cv' && kind !== 'skill')
      throw new RadarReviewInvalidEvidenceException();
    const result = await this.transactions.run(async (context) => {
      if (kind === 'cv') {
        const rows = await this.repository.changeCvDecision(
          adminId,
          id,
          action,
          context,
        );
        if (!rows.length) {
          const existing = await this.repository.cvOwner(id, context);
          if (!existing.length)
            throw new RadarReviewNotFoundException('CV inexistente');
          return { userId: existing[0].user_id, changed: false };
        }
        await this.access.recordAudit(
          rows[0].user_id,
          adminId,
          `cv.${action}`,
          id,
          {},
          context,
        );
        return { userId: rows[0].user_id, changed: true };
      }
      const old = await this.skills.skillForDecision(id, context);
      if (!old)
        throw new RadarReviewNotFoundException('Habilidad no encontrada');
      const changed = await this.skills.changeSkillDecision(
        id,
        action,
        context,
      );
      if (changed.count)
        await this.access.recordAudit(
          old.userId,
          adminId,
          `skill.${action}`,
          id,
          {},
          context,
        );
      return { userId: old.userId, changed: changed.count > 0 };
    });
    if (kind === 'cv' && result.changed)
      await this.nlp.refreshAfterChange(result.userId);
    return this.recalculateAfterDecision(result.userId, adminId);
  }
  private async recalculateAfterDecision(userId: string, actorId: string) {
    try {
      await this.publication.recalculate(userId, actorId);
    } catch {
    }
    return this.publication.myRadar(userId);
  }
  async downloadForAdmin(adminId: string, cvId: string) {
    const rows = await this.cvs.cvById(cvId);
    if (!rows?.cvPdfData)
      throw new RadarReviewNotFoundException('Archivo no encontrado');
    await this.audit(rows.userId, adminId, 'cv.viewed', cvId);
    return {
      filename: rows.cvFileName ?? 'curriculum.pdf',
      buffer: Buffer.from(rows.cvPdfData, 'base64'),
    };
  }
}
