import { radarPublishedPayloadSchema } from '../notification/radar-published-payload.schema.js';
import { NotificationsService } from '../../notifications/services/notifications.service.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import { ProfileSkillsAnalysisService } from '../../nlp/services/profile-skills-analysis.service.js';
import { Injectable, Logger } from '@nestjs/common';
import { RadarPublicationPendingAnalysisException } from '../exceptions/radar-publication-pending-analysis.exception.js';
import type { ProfileSkillsPublished } from '../../../common/profile-skills/profile-skills-events.service.js';
import { scoreVerifiedSkills } from '../utils/radar-scoring.js';
import { RadarPublicationRepository } from '../repositories/radar-publication.repository.js';
import { RadarPublicationMapper } from '../mappers/radar-publication.mapper.js';
import { RadarPublicationEvidenceService } from './radar-publication-evidence.service.js';
import { resolveRadarPublicationSkills } from '../utils/resolve-radar-publication-skills.js';

@Injectable()
export class RadarPublicationService {
  private readonly logger = new Logger(RadarPublicationService.name);
  constructor(
    private readonly repository: RadarPublicationRepository,
    private readonly mapper: RadarPublicationMapper,
    private readonly sources: RadarPublicationEvidenceService,
    private readonly nlp: ProfileSkillsAnalysisService,
    private readonly notifications: NotificationsService,
  ) {}

  // Inmutable e idempotente por titular; no se publica un snapshot parcial.
  async recalculate(
    userId: string,
    actorId: string | null,
    publication?: ProfileSkillsPublished,
  ) {
    let revision = publication?.inputRevision ?? 0;
    let attemptStartedAt = new Date();
    let publishedSnapshotId: string | null = null;
    let result;
    try {
      result = await this.repository.withTransaction(async (store, context) => {
        attemptStartedAt = await store.lockPublication(userId);
        const state = await this.nlp.readLockedRevision(userId, context);
        revision = state?.input_revision ?? 0;
        if (
          state &&
          (state.status !== 'ready' || state.processed_revision !== revision)
        ) {
          throw new RadarPublicationPendingAnalysisException();
        }
        if (publication && publication.inputRevision !== revision) return null;

        const evidence = await this.sources.read(userId, context);
        const accepted = resolveRadarPublicationSkills(userId, evidence);
        const calculated = scoreVerifiedSkills(accepted);
        const last = await store.snapshots(userId, 1);
        if (!last.length && !accepted.length) return null;
        if (last[0]?.fingerprint === calculated.fingerprint) {
          await store.recordSynchronized(
            userId,
            actorId,
            last[0].version,
            revision,
            accepted,
          );
          return this.mapper.snapshotResponse({
            ...last[0],
            source_revision: revision,
            skills: accepted,
          });
        }
        const version = (last[0]?.version ?? 0) + 1;
        const inserted = await store.insertSnapshot(
          userId,
          version,
          calculated,
        );

        if (!inserted[0]?.id) {
          throw new Error(
            'No se pudo obtener el identificador del radar publicado.',
          );
        }

        await store.recordPublished(
          userId,
          actorId,
          version,
          revision,
          accepted,
        );

        publishedSnapshotId = inserted[0].id;

        return this.mapper.snapshotResponse(
          { ...inserted[0], source_revision: revision, skills: accepted },
          last[0],
        );
      });
    } catch (error) {
      // El snapshot se revierte; intentar registrar el error sin ocultar el error inicial.
      try {
        await this.repository.recordFailure(
          userId,
          actorId,
          revision,
          attemptStartedAt,
        );
      } catch {}
      throw error;
    }
    if (publishedSnapshotId && result) {
      const snapshotId = String(publishedSnapshotId);
      try {
        await this.notifications.notify({
          recipientIds: [userId],
          type: NotificationType.RADAR_PUBLISHED,
          payload: radarPublishedPayloadSchema.parse({
            radarVersion: String(result.version),
            publishedAt: result.updatedAt.toISOString(),
          }),
          actionUrl: `/profile/radar?snapshot=${snapshotId}`,
          groupKey: `radar:${snapshotId}`,
        });
      } catch (error) {
        this.logger.error(
          'No se pudo notificar la publicacion del radar.',
          error,
        );
      }
    }
    return result;
  }

  simulationEligibility(userId: string) {
    return this.repository.withTransaction(async (_store, context) => {
      const state = await this.nlp.readLockedRevision(userId, context);
      const [skills, ...sources] = await this.sources.readSimulation(userId, context);
      const approved = skills
        .filter((skill) => skill.verificationStatus === 'approved')
        .map((skill) => ({ id: skill.skillId, name: skill.skill.name }));

      const highRelevanceSkillIds =
        state?.status === 'ready' &&
        state.input_revision === state.processed_revision
          ? resolveRadarPublicationSkills(userId, [
              skills.filter((skill) => skill.verificationStatus === 'pending'),
              ...sources,
            ])
              .filter((skill) => skill.isHighRelevance)
              .map((skill) => skill.id)
          : [];

      return { approved, highRelevanceSkillIds };
    }, 'RepeatableRead');
  }

  async myRadar(userId: string) {
    const [radarState, pendingSkills, state] = await Promise.all([
      this.repository.radarState(userId),
      this.sources.countPendingPublicationSkills(userId),
      this.nlp.getProcessingState(userId),
    ]);
    return this.mapper.myRadar(userId, { ...radarState, state, pendingSkills });
  }
}
