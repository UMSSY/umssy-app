import { Injectable } from '@nestjs/common';
import {
  AREA_IDS,
  emptyScores,
  RUBRIC_VERSION,
} from '../utils/radar-scoring.js';
import type {
  RadarPublicationState,
  SnapshotRow,
} from '../types/radar-publication.types.js';

@Injectable()
export class RadarPublicationMapper {
  snapshotResponse(row: SnapshotRow, previous?: SnapshotRow) {
    return {
      userId: row.user_id,
      status: 'published' as const,
      version: row.version,
      sourceRevision: row.source_revision,
      rubricVersion: row.rubric_version,
      updatedAt: row.created_at,
      scores: row.scores,
      average: Number(row.average_score),
      variation: previous
        ? Number(
            (
              Number(row.average_score) - Number(previous.average_score)
            ).toFixed(2),
          )
        : null,
      evidence: row.evidence,
      skills: row.skills,
    };
  }

  myRadar(
    userId: string,
    {
      snapshots: rows,
      pendingDocs,
      pendingSkills,
      state,
      attempts,
    }: RadarPublicationState,
  ) {
    const last = rows[0];
    const prev = rows[1];
    const pending = Number(pendingDocs[0]?.count ?? 0) + pendingSkills;
    const sourceRevision = state?.inputRevision ?? 0;
    const failed =
      state?.status === 'error' ||
      (attempts[0]?.status === 'error' &&
        attempts[0].source_revision === sourceRevision);
    const updating =
      (!!last && last.source_revision === null) ||
      (!!state &&
        (state.status !== 'ready' ||
          state.processedRevision !== sourceRevision ||
          last?.source_revision !== sourceRevision));
    return {
      ...(last
        ? this.snapshotResponse(last, prev)
        : {
            userId,
            status: 'empty' as const,
            version: 0,
            sourceRevision: null,
            rubricVersion: RUBRIC_VERSION,
            updatedAt: null,
            scores: emptyScores(),
            average: 0,
            variation: null,
            evidence: Object.fromEntries(AREA_IDS.map((id) => [id, []])),
            skills: [],
          }),
      pending,
      hasPending: pending > 0,
      processingStatus: failed
        ? ('error' as const)
        : updating
          ? ('pending' as const)
          : ('ready' as const),
      inputRevision: sourceRevision,
      dictionaryVersion: state?.dictionaryVersion ?? null,
    };
  }
}
