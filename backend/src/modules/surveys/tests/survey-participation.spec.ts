import { describe, expect, it } from 'vitest';
import type { SurveyParticipationTarget } from '../types/survey-participation-target.type.js';
import {
  buildSurveyAudienceFilter,
  buildSurveyAudienceLabel,
  computeResponseRate,
  isSurveyOpenForReminders,
  toTargetGraduationYear,
} from '../utils/survey-participation.js';

const NOW = new Date('2026-11-15T12:00:00.000Z');

function buildTarget(
  overrides: Partial<SurveyParticipationTarget> = {},
): SurveyParticipationTarget {
  return {
    id: 'survey-1',
    title: 'Empleabilidad 2020',
    academicPeriod: '2020',
    closesAt: new Date('2026-12-01T00:00:00.000Z'),
    lastReminderSentAt: null,
    publishedNotifiedPeriod: null,
    status: { title: 'published' },
    targetAudience: { title: 'graduates' },
    career: { id: 'career-1', title: 'Ingeniería de Sistemas' },
    ...overrides,
  };
}

describe('survey participation utils', () => {
  it('filtra la audiencia por rol, carrera objetivo y gestión', () => {
    expect(buildSurveyAudienceFilter(buildTarget())).toEqual({
      surveyId: 'survey-1',
      roles: ['titulado'],
      careerId: 'career-1',
      graduationYear: 2020,
    });
  });

  it('no restringe carrera ni gestión cuando la encuesta va a todas', () => {
    expect(
      buildSurveyAudienceFilter(
        buildTarget({ career: null, academicPeriod: 'Todas' }),
      ),
    ).toMatchObject({ careerId: null, graduationYear: null });
  });

  it('deja la audiencia vacía si la encuesta no tiene público objetivo', () => {
    expect(
      buildSurveyAudienceFilter(buildTarget({ targetAudience: null })).roles,
    ).toEqual([]);
  });

  it.each([
    ['2020', 2020],
    ['Todas', null],
    [null, null],
  ])('interpreta la gestión %s', (period, expected) => {
    expect(toTargetGraduationYear(period)).toBe(expected);
  });

  it('describe la audiencia objetivo', () => {
    expect(buildSurveyAudienceLabel(buildTarget())).toBe(
      'Titulados · Ingeniería de Sistemas · Gestión 2020',
    );
    expect(
      buildSurveyAudienceLabel(
        buildTarget({ career: null, academicPeriod: null }),
      ),
    ).toBe('Titulados · Todas las carreras · Todas las gestiones');
  });

  it.each([
    [0, 0, 0],
    [48, 120, 40],
    [1, 3, 33],
    [120, 120, 100],
  ])('calcula %i de %i como %i%%', (responded, eligible, expected) => {
    expect(computeResponseRate(responded, eligible)).toBe(expected);
  });

  it('solo permite recordatorios en encuestas publicadas y abiertas', () => {
    expect(isSurveyOpenForReminders(buildTarget(), NOW)).toBe(true);
    expect(
      isSurveyOpenForReminders(buildTarget({ status: { title: 'draft' } }), NOW),
    ).toBe(false);
    expect(
      isSurveyOpenForReminders(
        buildTarget({ closesAt: new Date('2026-11-01T00:00:00.000Z') }),
        NOW,
      ),
    ).toBe(false);
  });
});
