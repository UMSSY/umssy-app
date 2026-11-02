import type { INestApplication } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { JOB_OFFER_VALIDATION_MESSAGES as MESSAGES } from '../constants/job-offer.constants.js';
import { JobOffersController } from '../controllers/job-offers.controller.js';
import { CompanyNotFoundException, JobOfferNotFoundException } from '../exceptions/index.js';
import { JobOffersService } from '../services/job-offers.service.js';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

const COMPANY_ID = 'a0000000-0000-4000-8000-000000000001';
const URL = `/companies/${COMPANY_ID}/job-offers`;
const JOB_OFFER_ID = 'b0000000-0000-4000-8000-000000000001';

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
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

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

describe('GET /companies/:companyId/job-offers/:jobOfferId', () => {
  let app: INestApplication;
  let service: { getByCompanyAndId: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    service = {
      getByCompanyAndId: vi.fn().mockResolvedValue({
        id: JOB_OFFER_ID,
        skills: [{ id: 'skill-1', name: 'Docker' }],
      }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [JobOffersController],
      providers: [
        { provide: JobOffersService, useValue: service },
        { provide: APP_FILTER, useClass: DomainExceptionFilter },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('devuelve los detalles de una vacante dentro del alcance de la empresa', async () => {
    await request(app.getHttpServer())
      .get(`${URL}/${JOB_OFFER_ID}`)
      .expect(200)
      .expect({ id: JOB_OFFER_ID, skills: [{ id: 'skill-1', name: 'Docker' }] });

    expect(service.getByCompanyAndId).toHaveBeenCalledWith(COMPANY_ID, JOB_OFFER_ID);
  });

  it('rechaza un id de vacante que no es UUID', async () => {
    const response = await request(app.getHttpServer()).get(`${URL}/no-es-uuid`).expect(400);

    expect(response.body.errors).toEqual([
      { field: 'jobOfferId', message: MESSAGES.INVALID_JOB_OFFER_ID },
    ]);
    expect(service.getByCompanyAndId).not.toHaveBeenCalled();
  });

  it('responde 404 cuando la vacante no existe o no pertenece a la empresa', async () => {
    service.getByCompanyAndId.mockRejectedValue(new JobOfferNotFoundException());

    await request(app.getHttpServer()).get(`${URL}/${JOB_OFFER_ID}`).expect(404);
  });
});


describe('GET /companies/:companyId/job-offers - seguridad', () => {
  let app: INestApplication;
  let service: { listByCompany: ReturnType<typeof vi.fn> };

  async function createApp(
    authenticated: boolean,
    authorizedRole: boolean,
  ): Promise<INestApplication> {
    const moduleRef = await Test.createTestingModule({
      controllers: [JobOffersController],
      providers: [
        { provide: JobOffersService, useValue: service },
        { provide: APP_FILTER, useClass: DomainExceptionFilter },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => {
          if (!authenticated) throw new UnauthorizedException();
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => {
          if (!authorizedRole) throw new ForbiddenException();
          return true;
        },
      })
      .compile();

    const application = moduleRef.createNestApplication();
    await application.init();
    return application;
  }

  beforeEach(() => {
    service = { listByCompany: vi.fn().mockResolvedValue([]) };
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('rechaza con 401 una solicitud sin sesión', async () => {
    app = await createApp(false, false);

    await request(app.getHttpServer()).get(URL).expect(401);

    expect(service.listByCompany).not.toHaveBeenCalled();
  });

  it('rechaza con 403 una sesión sin rol empresa', async () => {
    app = await createApp(true, false);

    await request(app.getHttpServer()).get(URL).expect(403);

    expect(service.listByCompany).not.toHaveBeenCalled();
  });
});
