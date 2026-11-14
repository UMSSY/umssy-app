import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { DocumentTextExtractorService } from '../../access-requests/services/document-text-extractor.service.js';
import { SkillDetectionService } from '../../nlp/services/skill-detection.service.js';
import { SkillValidationService } from '../../nlp/services/skill-validation.service.js';
import { ProfileSkillsAnalysisService } from '../../nlp/services/profile-skills-analysis.service.js';
import { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';
import { DocumentVerificationRepository } from '../repositories/document-verification.repository.js';
import { evaluateRadarDocument } from '../utils/evaluate-radar-document.js';
import { MAX_NLP_SOURCE_LENGTH } from '../../nlp/constants/nlp-validation.constants.js';
import { AREA_IDS } from '../utils/radar-scoring.js';
import type { VerificationJob } from '../types/document-verification.type.js';
import { RadarPublicationService } from './radar-publication.service.js';

@Injectable()
export class DocumentVerificationService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(DocumentVerificationService.name);
  private timer?: NodeJS.Timeout;
  private current?: Promise<void>;
  constructor(
    private readonly store: DocumentVerificationRepository,
    private readonly ocr: DocumentTextExtractorService,
    private readonly detection: SkillDetectionService,
    private readonly validation: SkillValidationService,
    private readonly skills: SkillAnalysisService,
    private readonly nlp: ProfileSkillsAnalysisService,
    private readonly radar: RadarPublicationService,
  ) {}
  onApplicationBootstrap() {
    this.timer = setInterval(() => {
      this.current ??= this.processNext()
        .catch((error: unknown) =>
          this.logger.error('Falló una tarea de verificación', error),
        )
        .finally(() => {
          this.current = undefined;
        });
    }, 1500);
    this.timer.unref();
  }
  async onModuleDestroy() {
    clearInterval(this.timer);
    await this.current;
  }
  async processNext() {
    const job = await this.store.claim();
    if (!job) return;
    if (job.status === 'reading') {
      const result = await this.read(job);
      if (!(await this.store.finish(job, result))) return;
    }
    await this.nlp.refreshAfterChange(job.userId);
    const snapshot = await this.radar.recalculate(job.userId, null);
    const ids =
      snapshot?.skills
        .filter((s) =>
          s.evidenceRefs.some(
            (ref) => ref.id === job.sourceId && ref.type === job.sourceType,
          ),
        )
        .map((s) => s.id) ?? [];
    await this.store.markSynced(
      job,
      ids.length && snapshot ? snapshot.version : null,
      ids,
    );
  }
  private async read(job: VerificationJob) {
    let reading;
    try {
      reading = await this.ocr.extract(
        {
          name: job.filename,
          extension: job.filename.split('.').pop() ?? '',
          mimeType: job.mime,
          content: Buffer.from(job.content),
        },
        { maxPages: 40, maxPixels: 16000000 },
      );
    } catch {
      return evaluateRadarDocument(job, '', null, []);
    }
    const catalog = await this.skills.findCatalog();
    const sources = [
      { id: job.sourceId, type: job.sourceType, text: reading.text },
    ];
    const checked = this.validation.validateSources(sources);
    if (checked.rejected.length)
      return {
        status: 'review' as const,
        confidence: reading.confidence,
        reason:
          `El OCR extrajo ${reading.text.length.toLocaleString('es-BO')} caracteres. El análisis de habilidades admite hasta ${MAX_NLP_SOURCE_LENGTH.toLocaleString('es-BO')} por documento. Se omitió la detección y se solicitó revisión administrativa.`,
        skills: [],
      };
    const detected = this.detection.detect(
      { userId: job.userId, sources },
      catalog,
    );
    const accepted = new Set(
      this.validation
        .validateDetected(detected, catalog)
        .accepted.map((s) => s.id),
    );
    const skills = catalog.flatMap((s) =>
      accepted.has(s.id) && s.areaId && AREA_IDS.some((a) => a === s.areaId)
        ? [{ id: s.id, name: s.name, areaId: s.areaId }]
        : [],
    );
    return evaluateRadarDocument(job, reading.text, reading.confidence, skills);
  }
}
