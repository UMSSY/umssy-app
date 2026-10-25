
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_COMPANY_JOB_OFFERS_FILTERS,
  type ListCompanyJobOffersRequest,
} from '../requests/list-company-job-offers.request.js';
import { JobOfferContractType, JobOfferModality } from '../types/job-offer.enum.js';
import { buildCompanyJobOffersQuery } from '../utils/build-company-job-offers-query.js';

const COMPANY_ID = 'a0000000-0000-4000-8000-000000000001';

function build(filters: Partial<ListCompanyJobOffersRequest> = {}) {
  return buildCompanyJobOffersQuery(COMPANY_ID, {
    ...DEFAULT_COMPANY_JOB_OFFERS_FILTERS,
    ...filters,
  });
}

describe('buildCompanyJobOffersQuery', () => {
  it('sin filtros consulta todas las vacantes de la empresa en orden cronológico descendente', () => {
    expect(build()).toEqual({
      where: { companyId: COMPANY_ID },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  });

  it('incluye vacantes publicadas, cerradas y eliminadas en el historial', () => {
    expect(build().where).toEqual({
      companyId: COMPANY_ID,
    });
    expect(build().where.status).toBeUndefined();
  });

  it('filtra por modalidad usando el título del catálogo', () => {
    expect(build({ modality: JobOfferModality.HYBRID }).where).toEqual({
      companyId: COMPANY_ID,
      modality: { title: 'Híbrido' },
    });
  });

  it('filtra por tipo de contrato usando el título del catálogo', () => {
    expect(build({ contractType: JobOfferContractType.INTERNSHIP }).where).toEqual({
      companyId: COMPANY_ID,
      contractType: { title: 'Pasantía' },
    });
  });

  it('convierte el rango de fechas a días completos en hora de Bolivia', () => {
    expect(build({ dateFrom: '2026-10-01', dateTo: '2026-10-31' }).where.createdAt).toEqual({
      gte: new Date('2026-10-01T04:00:00.000Z'),
      lt: new Date('2026-11-01T04:00:00.000Z'),
    });
  });

  it('incluye todo el día cuando ambas fechas son iguales', () => {
    expect(build({ dateFrom: '2026-10-21', dateTo: '2026-10-21' }).where.createdAt).toEqual({
      gte: new Date('2026-10-21T04:00:00.000Z'),
      lt: new Date('2026-10-22T04:00:00.000Z'),
    });
  });

  it('acepta solo la fecha inicial', () => {
    expect(build({ dateFrom: '2026-10-01' }).where.createdAt).toEqual({
      gte: new Date('2026-10-01T04:00:00.000Z'),
    });
  });

  it('acepta solo la fecha final', () => {
    expect(build({ dateTo: '2026-10-31' }).where.createdAt).toEqual({
      lt: new Date('2026-11-01T04:00:00.000Z'),
    });
  });

  it('busca por título sin distinguir mayúsculas', () => {
    expect(build({ search: 'backend' }).where.title).toEqual({
      contains: 'backend',
      mode: 'insensitive',
    });
  });

  it('combina todos los filtros a la vez', () => {
    expect(
      build({
        modality: JobOfferModality.REMOTE,
        contractType: JobOfferContractType.FULL_TIME,
        dateFrom: '2026-10-01',
        search: 'devops',
      }).where,
    ).toEqual({
      companyId: COMPANY_ID,
      modality: { title: 'Remoto' },
      contractType: { title: 'Tiempo completo' },
      createdAt: { gte: new Date('2026-10-01T04:00:00.000Z') },
      title: { contains: 'devops', mode: 'insensitive' },
    });
  });

  it('ordena de la más antigua a la más reciente cuando el orden es ascendente', () => {
    expect(build({ order: 'asc' }).orderBy).toEqual([
      { createdAt: 'asc' },
      { id: 'asc' },
    ]);
  });

  it('mientras no existan postulaciones, ordenar por postulantes usa la fecha', () => {
    expect(build({ sortBy: 'applicants', order: 'asc' }).orderBy).toEqual([
      { createdAt: 'asc' },
      { id: 'asc' },
    ]);
  });
});
