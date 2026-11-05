import { describe, expect, it } from 'vitest';
import { mapPublishedRadar } from './radar-published.mapper';
import type { IntegrationRadar } from '../services/radar-integration.service';

const createSnapshot = (overrides: Partial<IntegrationRadar> = {}): IntegrationRadar => ({
  dictionaryVersion: '1', userId: 'user-1', status: 'published', version: 4,
  rubricVersion: 'servidor-v1', updatedAt: '2026-10-25T10:00:00Z',
  scores: {desarrollo:0,'cloud-devops':0,'data-ai':7,qa:0,ciberseguridad:0,'gobernanza-ti':0},
  average: 7/6, variation: null, pending: 0, hasPending: false,
  evidence: {}, sourceRevision: 1, inputRevision: 1, processingStatus: 'ready', skills: [],
  ...overrides,
});

describe('Radar publicado por backend', () => {
  it('reutiliza sin recalcular la puntuación y media de la publicación', () => {
    const source = createSnapshot({average: 3.87, scores: {...createSnapshot().scores, 'data-ai': 8.2}});
    const mapped = mapPublishedRadar(source);
    expect(mapped.areas.find(axis => axis.id==='data-ai')?.score).toBe(8.2);
    expect(mapped.average).toBe(3.87);
    expect(mapped.rubric).toBe('servidor-v1');
  });
  it('conserva los seis ejes cuando no hay habilidades', () => {
    const mapped = mapPublishedRadar(createSnapshot({scores: {desarrollo:0,'cloud-devops':0,'data-ai':0,qa:0,ciberseguridad:0,'gobernanza-ti':0},average:0}));
    expect(mapped.areas).toHaveLength(6);
    expect(mapped.areas.every(area => area.score===0)).toBe(true);
    expect(mapped.average).toBe(0);
  });
});
