import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';
import { NLP_DICTIONARY_VERSION } from '../constants/nlp-dictionary.constants.js';
import { NLP_LOG_EVENTS } from '../constants/nlp-processing.constants.js';
import { ProfileSkillsRadarMapper } from '../mappers/profile-skills-radar.mapper.js';
import { ProfileSkillResultsRepository } from '../repositories/profile-skill-results.repository.js';
import { ProfileSkillSourcesService } from './profile-skill-sources.service.js';
import type { ProfileSkillsAnalysisResponse } from '../responses/profile-skills-analysis.response.js';
import type { ProfileSkillsRadarResponse } from '../responses/profile-skills-radar.response.js';
import type { NlpAnalysisOutcome } from '../types/nlp-analysis-outcome.type.js';
import { toErrorCode } from '../utils/to-error-code.js';
import { SkillDetectionService } from './skill-detection.service.js';
import { SkillValidationService } from './skill-validation.service.js';

@Injectable()
export class ProfileSkillsAnalysisService {
  private readonly logger = new Logger(ProfileSkillsAnalysisService.name);

  constructor(
    private readonly sources: ProfileSkillSourcesService,
    private readonly results: ProfileSkillResultsRepository,
    private readonly detection: SkillDetectionService,
    private readonly validation: SkillValidationService,
    private readonly mapper: ProfileSkillsRadarMapper,
    private readonly skills: SkillAnalysisService,
  ) {}

  async refreshAfterChange(userId: string): Promise<void> {
    try {
      const state = await this.results.registerSourceChange(userId, new Date());
      await this.process(userId, state.inputRevision);
    } catch (error) {
      this.write('error', NLP_LOG_EVENTS.triggerFailed, { userId, code: toErrorCode(error) });
    }
  }

  async analyzeNow(userId: string): Promise<ProfileSkillsAnalysisResponse> {
    await this.sources.ensureProfileExists(userId);
    const state = await this.results.ensureState(userId, new Date());
    const outcome = await this.process(userId, state.inputRevision);
    return this.mapper.toAnalysisResponse(await this.readSnapshot(userId), outcome);
  }

  async getRadarSnapshot(userId: string): Promise<ProfileSkillsRadarResponse> {
    await this.sources.ensureProfileExists(userId);
    return this.readSnapshot(userId);
  }

  private async process(userId: string, revision: number): Promise<NlpAnalysisOutcome> {
    const correlationId = randomUUID();
    const startedAt = performance.now();
    const outcome: NlpAnalysisOutcome = { status: 'error', discarded: [], rejectedSources: [] };
    this.write('log', NLP_LOG_EVENTS.started, { correlationId, userId, revision });

    try {
      const [textSources, catalog] = await Promise.all([
        this.sources.findTextSources(userId),
        this.sources.findCatalog(),
      ]);
      const sources = this.validation.validateSources(textSources);
      const candidates = this.detection.detect({ userId, sources: sources.accepted });
      const detection = this.validation.validateDetected(candidates, catalog);
      outcome.rejectedSources = sources.rejected;
      outcome.discarded = detection.discarded;

      const published = await this.results.publish(
        userId,
        revision,
        NLP_DICTIONARY_VERSION,
        new Date(),
        (context) => this.skills.reconcileDetected(userId, detection.accepted, context),
      );
      outcome.status = published ? 'ready' : 'stale';
      this.write('log', published ? NLP_LOG_EVENTS.finished : NLP_LOG_EVENTS.stale, {
        correlationId,
        userId,
        revision,
        durationMs: Math.round(performance.now() - startedAt),
        sources: textSources.length,
        rejectedSources: sources.rejected.length,
        detected: candidates.length,
        accepted: detection.accepted.length,
        discarded: detection.discarded.length,
        resultVersion: published?.state.resultVersion ?? null,
        changed: published?.changed ?? false,
      });
    } catch (error) {
      await this.markError(userId, revision);
      this.write('error', NLP_LOG_EVENTS.failed, {
        correlationId,
        userId,
        revision,
        durationMs: Math.round(performance.now() - startedAt),
        code: toErrorCode(error),
      });
    }
    return outcome;
  }

  private async markError(userId: string, revision: number): Promise<void> {
    try {
      await this.results.markError(userId, revision, new Date());
    } catch {
    }
  }

  private async readSnapshot(userId: string): Promise<ProfileSkillsRadarResponse> {
    const [state, rows] = await Promise.all([
      this.results.findState(userId),
      this.skills.findProfileSkillRows(userId),
    ]);
    return this.mapper.toRadarResponse(userId, state, rows);
  }

  private write(level: 'log' | 'error', event: string, fields: Record<string, unknown>): void {
    this.logger[level](JSON.stringify({ event, ...fields }));
  }
}
