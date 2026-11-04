import type { IntegrationRadar } from '../sprint2-integration/radar-integration-api';
import { RADAR_AXIS_NAMES } from '../sprint2/types';
import type { RadarBridgeView, Epic2Skill } from '../sprint2/types';

/** Única fuente de puntuaciones: snapshot persistida del backend. */
export function mapPublishedRadar(stored?: IntegrationRadar | null): RadarBridgeView {
  const safeStored = stored ?? ({} as Partial<IntegrationRadar>);
  const skillsList = Array.isArray(safeStored.skills) ? safeStored.skills : [];
  const scoresObj = safeStored.scores && typeof safeStored.scores === 'object' ? safeStored.scores : {};
  const approved: Epic2Skill[] = skillsList.map(skill => ({
    ...skill,
    text: skill.name ?? '',
    source: 'nlp',
    verificationStatus: 'approved',
  }));
  return {
    userId: safeStored.userId ?? '',
    status: safeStored.processingStatus === 'error' ? 'error' : safeStored.hasPending ? 'pending' : 'ready',
    processingStatus: safeStored.processingStatus,
    version: typeof safeStored.version === 'number' ? safeStored.version : 0,
    updatedAt: safeStored.updatedAt ?? null,
    dictionaryVersion: safeStored.dictionaryVersion ?? null,
    areas: RADAR_AXIS_NAMES.map(axis => ({
      ...axis,
      score: typeof scoresObj[axis.id] === 'number' ? scoresObj[axis.id] : 0,
    })),
    average: typeof safeStored.average === 'number' ? safeStored.average : 0,
    approved,
    pendingCount: typeof safeStored.pending === 'number' ? safeStored.pending : 0,
    keywordCount: approved.length,
    highRelevanceCount: approved.filter(skill => Boolean(skill.isHighRelevance)).length,
    rubric: safeStored.rubricVersion ?? '',
  };
}
