import type { INestApplication } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { JOB_OFFER_VALIDATION_MESSAGES as MESSAGES } from '../constants/job-offer.constants.js';
import { JobOffersController } from '../controllers/job-offers.controller.js';
import { CompanyNotFoundException } from '../exceptions/index.js';
import { JobOffersService } from '../services/job-offers.service.js';

const COMPANY_ID = 'a0000000-0000-4000-8000-000000000001';
const URL = `/companies/${COMPANY_ID}/job-offers`;

describe('GET /companies/:companyId/job-offers', () => {
  let app: INestApplication;
  let service: { listByCompany: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    service = { listByCompany: vi.fn().mockResolvedValue([]) };

    const moduleRef = await Test.createTestingModule({
      controllers: [JobOffersController],
      providers: [
        { provide: JobOffersService, useValue: service },
        { provide: APP_FILTER, useClass: DomainExceptionFilter },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('sin filtros pide las vacantes más recientes primero', async () => {
    await request(app.getHttpServer()).get(URL).expect(200).expect([]);

    expect(service.listByCompany).toHaveBeenCalledWith(COMPANY_ID, {
      sortBy: 'createdAt',
      order: 'desc',
    });
  });

  it('pasa al servicio todos los filtros ya validados', async () => {
    await request(app.getHttpServer())
      .get(URL)
      .query({
        modality: 'Híbrido',
        contractType: 'Pasantía',
        dateFrom: '2026-10-01',
        dateTo: '2026-10-31',
        search: '  react  ',
        sortBy: 'applicants',
        order: 'asc',
      })
      .expect(200);

    expect(service.listByCompany).toHaveBeenCalledWith(COMPANY_ID, {
      modality: 'Híbrido',
      contractType: 'Pasantía',
      dateFrom: '2026-10-01',
      dateTo: '2026-10-31',
      search: 'react',
      sortBy: 'applicants',
      order: 'asc',
    });
  });

  it('ignora los filtros vacíos que manda "Limpiar filtros"', async () => {
    await request(app.getHttpServer())
      .get(`${URL}?modality=&contractType=&dateFrom=&search=`)
      .expect(200);

    expect(service.listByCompany).toHaveBeenCalledWith(COMPANY_ID, {
      sortBy: 'createdAt',
      order: 'desc',
    });
  });

  it('rechaza un filtro inválido indicando el campo y el mensaje', async () => {
    const response = await request(app.getHttpServer())
      .get(URL)
      .query({ modality: 'Volador' })
      .expect(400);

    expect(response.body.errors).toEqual([
      { field: 'modality', message: MESSAGES.INVALID_MODALITY },
    ]);
    expect(service.listByCompany).not.toHaveBeenCalled();
  });

  it('rechaza un rango de fechas invertido', async () => {
    const response = await request(app.getHttpServer())
      .get(URL)
      .query({ dateFrom: '2026-10-31', dateTo: '2026-10-01' })
      .expect(400);

    expect(response.body.errors).toEqual([
      { field: 'dateFrom', message: MESSAGES.DATE_RANGE_INVALID },
    ]);
  });

  it('rechaza un id de empresa que no es UUID', async () => {
    const response = await request(app.getHttpServer())
      .get('/companies/no-es-uuid/job-offers')
      .expect(400);

    expect(response.body.errors).toEqual([
      { field: 'companyId', message: MESSAGES.INVALID_COMPANY_ID },
    ]);
  });

  it('responde 404 si la empresa no existe', async () => {
    service.listByCompany.mockRejectedValue(new CompanyNotFoundException());

    await request(app.getHttpServer()).get(URL).expect(404);
  });
});