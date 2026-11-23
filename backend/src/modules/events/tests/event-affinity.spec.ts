import { describe, expect, it } from 'vitest';
import type { AffinitySignals } from '../types/affinity-signals.types.js';
import type { EventWithRelations } from '../types/events.types.js';
import {
  containsPhrase,
  extractKeywords,
  normalizeAffinityText,
} from '../utils/affinity-text.js';
import { rankEventsByAffinity } from '../utils/rank-events-by-affinity.js';
import { readRadarScores } from '../utils/read-radar-scores.js';
import {
  hasAffinitySignals,
  scoreEventAffinity,
} from '../utils/score-event-affinity.js';

const NO_SIGNALS: AffinitySignals = {
  skills: [],
  radarScores: {},
  careers: [],
  interests: '',
};

function buildEvent(
  id: string,
  title: string,
  registrations = 0,
  description: string | null = null,
  category = 'Empleabilidad',
): EventWithRelations {
  return {
    id,
    title,
    description,
    eventDate: new Date('2026-12-15T00:00:00.000Z'),
    startTime: new Date('1970-01-01T10:00:00.000Z'),
    endTime: new Date('1970-01-01T12:00:00.000Z'),
    location: null,
    capacity: null,
    statusId: 'status-1',
    instructorName: null,
    modalityId: 'modality-1',
    supportThreshold: null,
    votingDeadline: null,
    status: { title: 'Publicado' },
    origin: { title: 'Institucional' },
    category: { id: 'cat-1', name: category },
    coverMimeType: null,
    registrations: [],
    sessions: [],
    _count: { registrations },
  };
}

describe('affinity text', () => {
  it('normalizes case, accents and punctuation', () => {
    expect(normalizeAffinityText('  Introducción a Node.js & C++ ')).toBe(
      'introduccion a node js c++',
    );
  });

  it('matches whole phrases only', () => {
    const text = normalizeAffinityText('Taller de React Native y Go');
    expect(containsPhrase(text, 'React Native')).toBe(true);
    expect(containsPhrase(text, 'go')).toBe(true);
    expect(containsPhrase(text, 'Native Script')).toBe(false);
    expect(containsPhrase('reactividad', 'React')).toBe(false);
    expect(containsPhrase(text, '!!')).toBe(false);
  });

  it('extracts unique keywords without stopwords or short words', () => {
    expect(
      extractKeywords(
        'Ingeniería de Sistemas, interesado en Robótica y robótica',
      ),
    ).toEqual(['sistemas', 'robotica']);
  });
});

describe('readRadarScores', () => {
  it('keeps only positive numeric scores of known radar areas', () => {
    expect(
      readRadarScores({
        desarrollo: 7,
        qa: 0,
        ciberseguridad: '9',
        unknown: 5,
        'data-ai': Number.NaN,
      }),
    ).toEqual({ desarrollo: 7 });
  });

  it.each([null, undefined, 'scores', [1, 2]])(
    'returns no scores for %s',
    (value) => {
      expect(readRadarScores(value)).toEqual({});
    },
  );
});

describe('scoreEventAffinity', () => {
  it('detects when the profile has no usable signals', () => {
    expect(hasAffinitySignals(NO_SIGNALS)).toBe(false);
    expect(hasAffinitySignals({ ...NO_SIGNALS, interests: 'de la y' })).toBe(
      false,
    );
    expect(hasAffinitySignals({ ...NO_SIGNALS, careers: ['Sistemas'] })).toBe(
      true,
    );
    expect(scoreEventAffinity(buildEvent('a', 'React'), NO_SIGNALS)).toEqual({
      affinity: 0,
      reasons: [],
    });
  });

  it('gives the whole affinity share to the only available signal', () => {
    const result = scoreEventAffinity(
      buildEvent('a', 'React y TypeScript desde cero'),
      { ...NO_SIGNALS, skills: ['React', 'TypeScript', 'Java'] },
    );

    expect(result.affinity).toBeCloseTo(0.8);
    expect(result.reasons).toEqual(['React', 'TypeScript']);
  });

  it('combines skills, radar, career and interests with their weights', () => {
    const event = buildEvent(
      'a',
      'Pentesting web con Linux',
      0,
      'Seguridad para sistemas y robótica',
      'Tecnología',
    );
    const result = scoreEventAffinity(event, {
      skills: ['Linux', 'Docker'],
      radarScores: { ciberseguridad: 8, desarrollo: 9 },
      careers: ['Ingeniería de Sistemas', 'Medicina'],
      interests: 'Me apasiona la robótica',
    });

    const expected = 0.35 * 0.5 + 0.25 * 0.9 + 0.1 * 1 + 0.1 * (1 / 3);
    expect(result.affinity).toBeCloseTo(expected);
    expect(result.reasons).toEqual([
      'Linux',
      'Desarrollo de Software',
      'Ciberseguridad',
      'Ingeniería de Sistemas',
      'Tus intereses',
    ]);
  });

  it('scores zero when no signal matches the workshop', () => {
    const result = scoreEventAffinity(buildEvent('a', 'Oratoria'), {
      skills: ['React'],
      radarScores: { qa: 5 },
      careers: ['Ingeniería de Sistemas'],
      interests: 'robótica',
    });

    expect(result).toEqual({ affinity: 0, reasons: [] });
  });
});

describe('rankEventsByAffinity', () => {
  const signals: AffinitySignals = { ...NO_SIGNALS, skills: ['React', 'SQL'] };

  it('puts affine workshops before popular ones without matches', () => {
    const ranked = rankEventsByAffinity(
      [
        buildEvent('popular', 'Oratoria', 50),
        buildEvent('weak', 'Intro a SQL', 0),
      ],
      signals,
    );

    expect(ranked.map(({ event }) => event.id)).toEqual(['weak', 'popular']);
    expect(ranked[1].recommendation).toEqual({ score: 20, reasons: [] });
  });

  it('breaks affinity ties by popularity and then by original order', () => {
    const ranked = rankEventsByAffinity(
      [
        buildEvent('first', 'React básico', 2),
        buildEvent('second', 'React avanzado', 8),
        buildEvent('third', 'React hooks', 2),
        buildEvent('none-a', 'Oratoria', 0),
        buildEvent('none-b', 'Liderazgo', 0),
      ],
      signals,
    );

    expect(ranked.map(({ event }) => event.id)).toEqual([
      'second',
      'first',
      'third',
      'none-a',
      'none-b',
    ]);
    expect(ranked[0].recommendation.score).toBe(60);
  });
});
