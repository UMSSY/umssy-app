import type { IntegrationRadar } from '../sprint2-integration/radar-integration-api';
import { RADAR_AXIS_NAMES } from '../sprint2/types';
import type { RadarBridgeView, Epic2Skill } from '../sprint2/types';

/** Única fuente de puntuaciones: snapshot persistida del backend. */
export function mapPublishedRadar(stored: IntegrationRadar): RadarBridgeView {
  const approved: Epic2Skill[] = stored.skills.map(skill => ({
    ...skill,
    text: skill.name,
    source: 'nlp',
    verificationStatus: 'approved',
  }));
  return {
    userId: stored.userId,
    status: stored.processingStatus === 'error' ? 'error' : stored.hasPending ? 'pending' : 'ready',
    processingStatus: stored.processingStatus,
    version: stored.version,
    updatedAt: stored.updatedAt,
    dictionaryVersion: stored.dictionaryVersion ?? null,
    areas: RADAR_AXIS_NAMES.map(axis => ({ ...axis, score: stored.scores[axis.id] ?? 0 })),
    average: stored.average,
    approved,
    pendingCount: stored.pending,
    keywordCount: approved.length,
    highRelevanceCount: approved.filter(skill => skill.isHighRelevance).length,
    rubric: stored.rubricVersion,
  };
}
