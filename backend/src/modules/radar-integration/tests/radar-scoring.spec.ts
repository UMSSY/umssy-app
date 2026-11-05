import { describe, expect, it } from 'vitest';
import {
  AREA_IDS,
  emptyScores,
  matchRadar,
  scoreVerifiedSkills,
  type EvidenceSkill,
} from '../radar-scoring.js';

const skill = (
  id: string,
  areaId: string | null,
  isHighRelevance = false,
): EvidenceSkill => ({
  id,
  name: `Skill ${id}`,
  areaId,
  isHighRelevance,
});

describe('scoreVerifiedSkills', () => {
  it('acumula puntajes por área y aplica relevancia alta', () => {
    const result = scoreVerifiedSkills([
      skill('a', 'desarrollo'),
      skill('b', 'desarrollo', true),
      skill('c', 'data-ai'),
      skill('d', null),
    ]);

    expect(result.scores.desarrollo).toBe(2.5);
    expect(result.scores['data-ai']).toBe(1);
    expect(result.scores.qa).toBe(0);
    expect(result.evidence.desarrollo.map((item) => item.id)).toEqual(['a', 'b']);
    expect(result.average).toBeCloseTo(0.58, 2);
  });

  it('limita cada eje a 10 puntos y deduplica habilidades por id', () => {
    const result = scoreVerifiedSkills([
      ...Array.from({ length: 12 }, (_, index) => skill(`d${index}`, 'desarrollo', true)),
      skill('d0', 'desarrollo', true),
    ]);

    expect(result.scores.desarrollo).toBe(10);
    expect(result.evidence.desarrollo).toHaveLength(12);
  });

  it('genera una huella estable e independiente del orden de entrada', () => {
    const left = scoreVerifiedSkills([skill('b', 'qa'), skill('a', 'desarrollo')]);
    const right = scoreVerifiedSkills([skill('a', 'desarrollo'), skill('b', 'qa')]);

    expect(left.fingerprint).toBe(right.fingerprint);
    expect(left.fingerprint).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('matchRadar', () => {
  it('calcula brechas con un decimal y porcentaje acotado entre 0 y 100', () => {
    const candidate = emptyScores();
    const target = emptyScores();
    candidate.desarrollo = 7.5;
    target.desarrollo = 10;

    const result = matchRadar(candidate, target);

    expect(result.gaps.desarrollo).toBe(-2.5);
    expect(result.match).toBe(96);
  });

  it('devuelve 0 cuando la diferencia supera la escala total', () => {
    const candidate = emptyScores();
    const target = emptyScores();
    for (const id of AREA_IDS) {
      candidate[id] = 0;
      target[id] = 10;
    }

    expect(matchRadar(candidate, target).match).toBe(0);
  });

  it('devuelve 100 cuando los radares coinciden', () => {
    const scores = emptyScores();
    scores.desarrollo = 4.5;

    expect(matchRadar(scores, scores).match).toBe(100);
  });
});
