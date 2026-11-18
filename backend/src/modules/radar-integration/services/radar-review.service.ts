import { findReviewOperation } from '../utils/find-review-operation.js';
import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { CvSourcesService } from '../../cv/services/cv-sources.service.js';
import { ProfileSkillsAnalysisService } from '../../nlp/services/profile-skills-analysis.service.js';
import { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';
import { TransactionService } from '../../../common/prisma/transaction.service.js';
import { RadarReviewInvalidDecisionException } from '../exceptions/radar-review-invalid-decision.exception.js';
import { RadarReviewInvalidEvidenceException } from '../exceptions/radar-review-invalid-evidence.exception.js';
import { RadarReviewNotFoundException } from '../exceptions/radar-review-not-found.exception.js';
import { RadarAccessRepository } from '../repositories/radar-access.repository.js';
import { RadarReviewRepository } from '../repositories/radar-review.repository.js';
import { RadarReviewMapper } from '../mappers/radar-review.mapper.js';
import { RadarPublicationService } from './radar-publication.service.js';

import type { RadarReviewDecisionResult } from '../types/radar-review-decision-result.types.js';
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

  async decision(
    adminId: string,
    kind: string,
    id: string,
    action: string,
    operationId: string,
  ) {
    if (!['approved', 'rejected', 'revoked'].includes(action))
      throw new RadarReviewInvalidDecisionException();

    if (kind !== 'cv' && kind !== 'skill')
      throw new RadarReviewInvalidEvidenceException();

    const payloadHash = createHash('sha256')
      .update(JSON.stringify({ kind, targetId: id, decision: action }))
      .digest('hex');

    const operation = await this.transactions.run<{
      created: boolean;
      userId: string | null;
      changed: boolean;
      result: RadarReviewDecisionResult;
    }>(async (context) => {
      const saved = await findReviewOperation(this.repository, context, {
        adminId,
        operationId,
        flow: 'radar-review',
        kind,
        targetId: id,
        payloadHash,
      });
      if (saved) {
        return {
          created: false,
          userId: null as string | null,
          changed: false,
          result: saved.response_data as RadarReviewDecisionResult,
        };
      }

      let userId: string;
      let changed: boolean;

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

          userId = existing[0].user_id;
          changed = false;
        } else {
          userId = rows[0].user_id;
          changed = true;

          await this.access.recordAudit(
            userId,
            adminId,
            `cv.${action}`,
            id,
            {},
            context,
          );
        }
      } else {
        const old = await this.skills.skillForDecision(id, context);

        if (!old)
          throw new RadarReviewNotFoundException('Habilidad no encontrada');

        userId = old.userId;

        const update = await this.skills.changeSkillDecision(
          id,
          action,
          context,
        );

        changed = update.count > 0;

        if (changed) {
          await this.access.recordAudit(
            userId,
            adminId,
            `skill.${action}`,
            id,
            {},
            context,
          );
        }
      }

      const result = {
        operationId,
        status: 'completed' as const,
        kind: kind as 'cv' | 'skill',
        targetId: id,
        decision: action,
        changed,
        userId,
        completedAt: new Date().toISOString(),
      };

      await this.repository.saveReviewOperationResult(
        userId,
        adminId,
        operationId,
        'radar-review',
        kind,
        id,
        payloadHash,
        result,
        context,
      );

      return {
        created: true,
        userId,
        changed,
        result,
      };
    });

    if (operation.created && operation.userId) {
      if (kind === 'cv' && operation.changed)
        await this.nlp.refreshAfterChange(operation.userId);

      await this.recalculateAfterDecision(operation.userId, adminId);
    }

    return operation.result;
  }

  private async recalculateAfterDecision(userId: string, actorId: string) {
    try {
      await this.publication.recalculate(userId, actorId);
    } catch {}

    return this.publication.myRadar(userId);
  }

  async operationStatus(adminId: string, operationId: string) {
    return this.transactions.run(async (context) => {
      const saved = await findReviewOperation(this.repository, context, {
        adminId,
        operationId,
        flow: 'radar-review',
      });
      if (!saved)
        throw new RadarReviewNotFoundException('Operacion no encontrada');

      return saved.response_data;
    });
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
