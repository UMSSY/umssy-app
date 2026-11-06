import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MATCH_SCORE_WEIGHTS,
  MATCH_SCORE_WEIGHT_ENV_VARS,
} from '../constants/match-score.constants.js';
import { WeightedScoreService } from '../services/weighted-score.service.js';
import { resolveMatchScoreWeights } from '../utils/resolve-match-score-weights.js';

describe('resolveMatchScoreWeights (T3.1)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('usa los pesos por defecto cuando no hay variables de entorno', () => {
    expect(resolveMatchScoreWeights({})).toEqual(MATCH_SCORE_WEIGHTS);
  });

  it('cambia sólo las categorías que tienen variable de entorno', () => {
    const weights = resolveMatchScoreWeights({
      [MATCH_SCORE_WEIGHT_ENV_VARS.skills]: '70',
      [MATCH_SCORE_WEIGHT_ENV_VARS.otherRequirements]: ' 0 ',
    });

    expect(weights).toEqual({
      skills: 70,
      academicRequirements: 25,
      experienceRequirements: 10,
      otherRequirements: 0,
    });
  });

  it('ignora las variables vacías', () => {
    expect(
      resolveMatchScoreWeights({ [MATCH_SCORE_WEIGHT_ENV_VARS.skills]: '  ' }),
    ).toEqual(MATCH_SCORE_WEIGHTS);
  });

  it.each([['abc'], ['-5'], ['Infinity']])(
    'rechaza el valor inválido %s y nombra la variable',
    (raw) => {
      expect(() =>
        resolveMatchScoreWeights({
          [MATCH_SCORE_WEIGHT_ENV_VARS.academicRequirements]: raw,
        }),
      ).toThrow(MATCH_SCORE_WEIGHT_ENV_VARS.academicRequirements);
    },
  );

  it('no modifica la constante por defecto', () => {
    resolveMatchScoreWeights({ [MATCH_SCORE_WEIGHT_ENV_VARS.skills]: '99' });
    expect(MATCH_SCORE_WEIGHTS.skills).toBe(60);
  });

  it('el servicio toma los pesos de las variables de entorno al crearse', () => {
    vi.stubEnv(MATCH_SCORE_WEIGHT_ENV_VARS.skills, '1');
    vi.stubEnv(MATCH_SCORE_WEIGHT_ENV_VARS.academicRequirements, '1');
    const requirements = {
      skills: [{ name: 'Docker', status: 'Cumple' as const }],
      academicRequirements: [
        { name: 'Sistemas', status: 'Pendiente' as const },
      ],
      experienceRequirements: [],
      otherRequirements: [],
    };

    expect(new WeightedScoreService().calculate(requirements)).toBe(50);
  });
});
