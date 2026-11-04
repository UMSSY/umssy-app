import { ConflictException, Injectable } from '@nestjs/common';
import type { ProfileSkillsPublished } from '../../common/profile-skills/profile-skills-events.service.js';
import { AREA_IDS, emptyScores, RUBRIC_VERSION, scoreVerifiedSkills } from './radar-scoring.js';
import { RadarPublicationRepository, type PublishedSkill, type SnapshotRow } from './repositories/radar-publication.repository.js';

@Injectable()
export class RadarPublicationService {
  constructor(private readonly repository: RadarPublicationRepository) {}

  // Inmutable e idempotente por titular; no se publica un snapshot parcial.
  async recalculate(userId: string, actorId: string | null, publication?: ProfileSkillsPublished) {
    let revision = publication?.inputRevision ?? 0;
    let attemptStartedAt = new Date();
    try {
      return await this.repository.withTransaction(async (store) => {
        const { state, startedAt } = await store.lockAndReadRevision(userId);
        attemptStartedAt = startedAt;
        revision = state?.input_revision ?? 0;
        if (state && (state.status !== 'ready' || state.processed_revision !== revision)) {
          throw new ConflictException('El análisis del perfil aún no está actualizado.');
        }
        if (publication && publication.inputRevision !== revision) return null;

        const [rows, docs, experiences, educations, certifications] = await store.sourceEvidence(userId);
        const cvApproved = new Set(docs.filter(d => d.review_status === 'approved' && d.extraction_status === 'ready').map(d => d.cv_id));
        const living: Record<string, Set<string>> = {
          'work-experience': new Set(experiences.map(x => x.id)),
          education: new Set(educations.map(x => x.id)),
          certification: new Set(certifications.map(x => x.id)),
          cv: cvApproved,
        };
        const accepted: PublishedSkill[] = rows.flatMap(r => {
          const refs = Array.isArray(r.evidenceRefs) ? r.evidenceRefs : [];
          const valid = refs.flatMap(entry => {
            if (!entry || typeof entry !== 'object' || !('type' in entry) || !('id' in entry)) return [];
            const type = entry.type;
            const id = entry.id;
            if (typeof type !== 'string' || typeof id !== 'string' || !living[type]?.has(id)) return [];
            return [{ type, id }];
          }).sort((a, b) => `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`));
          if (r.source === 'nlp' && !valid.length) return [];
          if (!AREA_IDS.some(id => id === r.skill.areaId)) return [];
          return [{ id: r.skillId, name: r.skill.name, areaId: r.skill.areaId,
            isHighRelevance: r.isHighRelevance && valid.length > 0, evidenceRefs: valid }];
        });
        const calculated = scoreVerifiedSkills(accepted);
        const last = await store.snapshots(userId, 1);
        if (last[0]?.fingerprint === calculated.fingerprint) {
          await store.recordSynchronized(userId, actorId, last[0].version, revision, accepted);
          return this.snapshotResponse({ ...last[0], source_revision: revision, skills: accepted });
        }
        const version = (last[0]?.version ?? 0) + 1;
        const inserted = await store.insertSnapshot(userId, version, calculated);
        await store.recordPublished(userId, actorId, version, revision, accepted);
        return this.snapshotResponse({ ...inserted[0], source_revision: revision, skills: accepted }, last[0]);
      });
    } catch (error) {
      // El snapshot se revierte; intentar registrar el error sin ocultar el error inicial.
      try {
        await this.repository.recordFailure(userId, actorId, revision, attemptStartedAt);
      } catch {}
      throw error;
    }
  }

  private snapshotResponse(row: SnapshotRow, previous?: SnapshotRow) {
    return {
      userId: row.user_id, status: 'published' as const, version: row.version,
      sourceRevision: row.source_revision, rubricVersion: row.rubric_version,
      updatedAt: row.created_at, scores: row.scores, average: Number(row.average_score),
      variation: previous ? Number((Number(row.average_score) - Number(previous.average_score)).toFixed(2)) : null,
      evidence: row.evidence, skills: row.skills,
    };
  }

  async myRadar(userId: string) {
    const { snapshots: rows, pendingDocs, pendingSkills, state, attempts } = await this.repository.radarState(userId);
    const last = rows[0]; const prev = rows[1];
    const pending = Number(pendingDocs[0]?.count ?? 0) + pendingSkills;
    const sourceRevision = state?.inputRevision ?? 0;
    const failed = state?.status === 'error' || (attempts[0]?.status === 'error' && attempts[0].source_revision === sourceRevision);
    const updating = (!!last && last.source_revision === null)
      || (!!state && (state.status !== 'ready' || state.processedRevision !== sourceRevision || last?.source_revision !== sourceRevision));
    return {
      ...(last ? this.snapshotResponse(last, prev) : {
        userId, status: 'empty', version: 0, sourceRevision: null, rubricVersion: RUBRIC_VERSION,
        updatedAt: null, scores: emptyScores(), average: 0, variation: null,
        evidence: Object.fromEntries(AREA_IDS.map(id => [id, []])), skills: [],
      }),
      pending, hasPending: pending > 0, processingStatus: failed ? 'error' : updating ? 'pending' : 'ready',
      inputRevision: sourceRevision, dictionaryVersion: state?.dictionaryVersion ?? null,
    };
  }
}
