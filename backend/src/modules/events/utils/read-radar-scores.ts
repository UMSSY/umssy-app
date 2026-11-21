import { RADAR_AREAS } from '../../profile/constants/radar-areas.constants.js';
import type { AffinitySignals } from '../types/affinity-signals.types.js';

export function readRadarScores(value: unknown): AffinitySignals['radarScores'] {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return {};
  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    RADAR_AREAS.flatMap(({ id }) => {
      const score = record[id];
      return typeof score === 'number' && Number.isFinite(score) && score > 0
        ? [[id, score]]
        : [];
    }),
  );
}
