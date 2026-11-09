import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { RadarAnalysisNotReadyException } from '../exceptions/radar-analysis-not-ready.exception.js';
import {
  ProfileSkillsEvents,
  type ProfileSkillsPublished,
} from '../../../common/profile-skills/profile-skills-events.service.js';
import { ProfileSkillsAnalysisService } from '../../nlp/services/profile-skills-analysis.service.js';
import { RadarPublicationService } from './radar-publication.service.js';
import { RadarCvService } from './radar-cv.service.js';
import { RadarReviewService } from './radar-review.service.js';

@Injectable()
export class RadarIntegrationService implements OnModuleInit, OnModuleDestroy {
  private unsubscribe?: () => void;
  constructor(
    private readonly nlp: ProfileSkillsAnalysisService,
    private readonly events: ProfileSkillsEvents,
    private readonly publication: RadarPublicationService,
    private readonly cv: RadarCvService,
    private readonly review: RadarReviewService,
  ) {}

  onModuleInit(): void {
    this.unsubscribe = this.events.subscribe((publication) =>
      this.recalculate(publication.userId, null, publication).then(
        () => undefined,
      ),
    );
  }
  onModuleDestroy(): void {
    this.unsubscribe?.();
  }

  async retry(userId: string) {
    const analysis = await this.nlp.analyzeNow(userId);
    if (analysis.status !== 'ready') throw new RadarAnalysisNotReadyException();
    await this.recalculate(userId, userId);
    return this.myRadar(userId);
  }

  ingestCv(userId: string, cvId: string, buffer: Buffer, reprocess = false) {
    return this.cv.ingestCv(userId, cvId, buffer, reprocess);
  }
  rescanCurrentCv(userId: string) {
    return this.cv.rescanCurrentCv(userId);
  }
  reprocessCv(adminId: string, cvId: string) {
    return this.cv.reprocessCv(adminId, cvId);
  }
  cvRemoved(userId: string, cvId: string) {
    return this.cv.cvRemoved(userId, cvId);
  }
  recalculate(
    userId: string,
    actorId: string | null,
    publication?: ProfileSkillsPublished,
  ) {
    return this.publication.recalculate(userId, actorId, publication);
  }
  myRadar(userId: string) {
    return this.publication.myRadar(userId);
  }
  queue(adminId: string) {
    return this.review.queue(adminId);
  }
  decision(adminId: string, kind: string, id: string, action: string) {
    return this.review.decision(adminId, kind, id, action);
  }
  downloadForAdmin(adminId: string, cvId: string) {
    return this.review.downloadForAdmin(adminId, cvId);
  }
}
