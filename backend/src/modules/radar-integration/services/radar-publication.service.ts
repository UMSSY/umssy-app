import { ProfileSkillsAnalysisService } from '../../nlp/services/profile-skills-analysis.service.js';
import { Injectable } from '@nestjs/common';
import { RadarPublicationPendingAnalysisException } from '../exceptions/radar-publication-pending-analysis.exception.js';
import type { ProfileSkillsPublished } from '../../../common/profile-skills/profile-skills-events.service.js';
import { AREA_IDS, scoreVerifiedSkills } from '../utils/radar-scoring.js';
import { RadarPublicationRepository } from '../repositories/radar-publication.repository.js';
import { RadarPublicationMapper } from '../mappers/radar-publication.mapper.js';
import { RadarPublicationEvidenceService } from './radar-publication-evidence.service.js';
import type { PublishedSkill } from '../types/radar-publication.types.js';

@Injectable()
export class RadarPublicationService {
  constructor(
    private readonly repository: RadarPublicationRepository,
    private readonly mapper: RadarPublicationMapper,
    private readonly sources: RadarPublicationEvidenceService,
    private readonly nlp: ProfileSkillsAnalysisService,
  ) {}

  // Inmutable e idempotente por titular; no se publica un snapshot parcial.
  async recalculate(
    userId: string,
    actorId: string | null,
    publication?: ProfileSkillsPublished,
  ) {
    let revision = publication?.inputRevision ?? 0;
    let attemptStartedAt = new Date();
    try {
      return await this.repository.withTransaction(async (store, context) => {
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

        const [rows, docs, experiences, educations, certifications] =
          await this.sources.read(userId, context);
        const cvApproved = new Set(
          docs
            .filter(
              (d) =>
                d.review_status === 'approved' &&
                d.extraction_status === 'ready',
            )
            .map((d) => d.cv_id),
        );
        const living: Record<string, Set<string>> = {
          'work-experience': new Set(experiences.map((x) => x.id)),
          presentation: new Set([userId]),
          education: new Set(educations.map((x) => x.id)),
          certification: new Set(certifications.map((x) => x.id)),
          cv: cvApproved,
        };
        const accepted: PublishedSkill[] = rows.flatMap((r) => {
          const refs = Array.isArray(r.evidenceRefs) ? r.evidenceRefs : [];
          const valid = refs
            .flatMap((entry) => {
              if (
                !entry ||
                typeof entry !== 'object' ||
                !('type' in entry) ||
                !('id' in entry)
              )
                return [];
              const type = entry.type;
              const id = entry.id;
              if (
                typeof type !== 'string' ||
                typeof id !== 'string' ||
                !living[type]?.has(id)
              )
                return [];
              return [{ type, id }];
            })
            .sort((a, b) =>
              `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`),
            );
          if (r.source === 'nlp' && !valid.length) return [];
          if (!AREA_IDS.some((id) => id === r.skill.areaId)) return [];
          return [
            {
              id: r.skillId,
              name: r.skill.name,
              areaId: r.skill.areaId,
              isHighRelevance: r.isHighRelevance && valid.length > 0,
              evidenceRefs: valid,
            },
          ];
        });
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
        await store.recordPublished(
          userId,
          actorId,
          version,
          revision,
          accepted,
        );
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
