import { describe, expect, it } from 'vitest';
import {
  JOB_OFFER_TITLE_MAX_LENGTH,
  JOB_OFFER_VALIDATION_MESSAGES as MESSAGES,
} from '../constants/job-offer.constants.js';
import { listCompanyJobOffersSchema } from '../requests/list-company-job-offers.request.js';

function parse(query: Record<string, unknown>) {
  return listCompanyJobOffersSchema.safeParse(query);
}

function firstIssue(query: Record<string, unknown>) {
  const result = parse(query);
  return result.success ? undefined : result.error.issues[0];
}

describe('listCompanyJobOffersSchema', () => {
  it('sin filtros ordena por fecha de la más reciente a la más antigua', () => {
    expect(listCompanyJobOffersSchema.parse({})).toEqual({ sortBy: 'createdAt', order: 'desc' });
  });

  it('acepta todos los filtros válidos a la vez', () => {
    const parsed = listCompanyJobOffersSchema.parse({
      modality: 'Híbrido',
      contractType: 'Pasantía',
      dateFrom: '2026-10-01',
      dateTo: '2026-10-31',
      search: 'desarrollador',
      sortBy: 'applicants',
      order: 'asc',
    });

    expect(parsed).toEqual({
      modality: 'Híbrido',
      contractType: 'Pasantía',
      dateFrom: '2026-10-01',
      dateTo: '2026-10-31',
      search: 'desarrollador',
      sortBy: 'applicants',
      order: 'asc',
    });
  });

  it.each(['Presencial', 'Remoto', 'Híbrido'])('acepta la modalidad %s', (modality) => {
    expect(parse({ modality }).success).toBe(true);
  });

  it('rechaza una modalidad fuera del catálogo', () => {
    expect(firstIssue({ modality: 'Volador' })).toMatchObject({
      path: ['modality'],
      message: MESSAGES.INVALID_MODALITY,
    });
  });

  it.each(['Tiempo completo', 'Medio tiempo', 'Pasantía'])(
    'acepta el tipo de contrato %s',
    (contractType) => {
      expect(parse({ contractType }).success).toBe(true);
    },
  );

  it('rechaza un tipo de contrato fuera del catálogo', () => {
    expect(firstIssue({ contractType: 'Freelance' })).toMatchObject({
      path: ['contractType'],
      message: MESSAGES.INVALID_CONTRACT_TYPE,
    });
  });

  it.each([['2026-13-01'], ['01/10/2026'], ['ayer'], ['2026-10-01T00:00:00Z']])(
    'rechaza la fecha inválida %s',
    (dateFrom) => {
      expect(firstIssue({ dateFrom })).toMatchObject({
        path: ['dateFrom'],
        message: MESSAGES.INVALID_DATE,
      });
    },
  );

  it('acepta un rango donde ambas fechas son el mismo día', () => {
    expect(parse({ dateFrom: '2026-10-21', dateTo: '2026-10-21' }).success).toBe(true);
  });

  it('acepta solo una de las dos fechas', () => {
    expect(parse({ dateFrom: '2026-10-01' }).success).toBe(true);
    expect(parse({ dateTo: '2026-10-31' }).success).toBe(true);
  });

  it('rechaza un rango con la fecha inicial mayor a la final', () => {
    expect(firstIssue({ dateFrom: '2026-10-31', dateTo: '2026-10-01' })).toMatchObject({
      path: ['dateFrom'],
      message: MESSAGES.DATE_RANGE_INVALID,
    });
  });

  it('rechaza un campo de orden no permitido', () => {
    expect(firstIssue({ sortBy: 'salary' })).toMatchObject({
      path: ['sortBy'],
      message: MESSAGES.INVALID_SORT_BY,
    });
  });

  it('rechaza una dirección de orden no permitida', () => {
    expect(firstIssue({ order: 'random' })).toMatchObject({
      path: ['order'],
      message: MESSAGES.INVALID_SORT_ORDER,
    });
  });

  it('recorta los espacios de la búsqueda', () => {
    expect(listCompanyJobOffersSchema.parse({ search: '  backend  ' }).search).toBe('backend');
  });

  it('rechaza una búsqueda más larga que el título del puesto', () => {
    expect(firstIssue({ search: 'a'.repeat(JOB_OFFER_TITLE_MAX_LENGTH + 1) })).toMatchObject({
      path: ['search'],
      message: MESSAGES.SEARCH_TOO_LONG,
    });
  });

  it('trata los parámetros vacíos o con solo espacios como no enviados', () => {
    expect(
      listCompanyJobOffersSchema.parse({
        modality: '',
        contractType: '  ',
        dateFrom: '',
        dateTo: ' ',
        search: '   ',
        sortBy: '',
        order: '',
      }),
    ).toEqual({ sortBy: 'createdAt', order: 'desc' });
  });
});