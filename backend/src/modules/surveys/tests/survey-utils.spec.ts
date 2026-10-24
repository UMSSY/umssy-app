import { describe, expect, it, vi } from 'vitest';
import { SURVEY_ERROR_MESSAGES } from '../constants/survey.constants.js';
import {
  CareerNotFoundException,
  InvalidSurveyScheduleException,
  SurveyTitleAlreadyExistsException,
} from '../exceptions/index.js';
import type { CareersRepository } from '../repositories/careers.repository.js';
import { SurveyMapper } from '../mappers/survey.mapper.js';
import { CareersService } from '../services/careers.service.js';
import { findDuplicatedLabels, normalizeLabel } from '../utils/find-duplicated-labels.js';
import { getScheduleError } from '../utils/survey-schedule.js';

const NOW = new Date('2026-10-22T15:00:00.000Z');

describe('findDuplicatedLabels', () => {
  it('normaliza con trim y minúsculas', () => {
    expect(normalizeLabel('  Sí ')).toBe('sí');
  });

  it('devuelve las etiquetas repetidas una sola vez e ignora las vacías', () => {
    expect(findDuplicatedLabels(['Sí', 'sí ', 'No', 'SÍ', '', ' '])).toEqual(['sí']);
  });

  it('devuelve una lista vacía si no hay repetidas', () => {
    expect(findDuplicatedLabels(['A', 'B'])).toEqual([]);
  });
});

describe('getScheduleError', () => {
  it('acepta una vigencia válida', () => {
    expect(
      getScheduleError(new Date('2026-11-03T04:00:00.000Z'), new Date('2026-12-16T03:59:59.999Z'), NOW),
    ).toBeNull();
  });

  it('compara los días en la zona horaria de Bolivia', () => {
    const lateTonightInBolivia = new Date('2026-10-23T03:30:00.000Z');

    expect(getScheduleError(new Date('2026-10-22T04:00:00.000Z'), new Date('2026-10-23T04:00:00.000Z'), lateTonightInBolivia)).toBeNull();
  });

  it('rechaza una apertura en el pasado', () => {
    expect(getScheduleError(new Date('2026-10-21T04:00:00.000Z'), new Date('2026-12-01T04:00:00.000Z'), NOW)).toEqual({
      field: 'opensAt',
      message: SURVEY_ERROR_MESSAGES.OPENS_IN_THE_PAST,
    });
  });

  it('rechaza un cierre anterior a la apertura', () => {
    expect(getScheduleError(new Date('2026-11-10T04:00:00.000Z'), new Date('2026-11-05T04:00:00.000Z'), NOW)).toEqual({
      field: 'closesAt',
      message: SURVEY_ERROR_MESSAGES.CLOSES_BEFORE_OPENS,
    });
  });
});

describe('Survey exceptions', () => {
  it.each([
    [new SurveyTitleAlreadyExistsException(), 409, { field: 'title' }],
    [new CareerNotFoundException(), 404, { field: 'careerId' }],
    [new InvalidSurveyScheduleException({ field: 'opensAt', message: 'x' }), 400, { field: 'opensAt' }],
  ])('%o expone su estado y el campo afectado', (exception, statusCode, data) => {
    expect(exception.statusCode).toBe(statusCode);
    expect(exception.data).toEqual(data);
    expect(exception.name).toMatch(/Exception$/);
  });
});

describe('CareersService', () => {
  it('lista las carreras con el contrato id y título', async () => {
    const repository = { findAll: vi.fn().mockResolvedValue([{ id: 'career-1', title: 'Sistemas' }]) };
    const service = new CareersService(repository as unknown as CareersRepository, new SurveyMapper());

    await expect(service.listCareers()).resolves.toEqual([{ id: 'career-1', title: 'Sistemas' }]);
  });
});
