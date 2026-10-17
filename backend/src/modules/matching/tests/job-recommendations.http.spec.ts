import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { JobRecommendationsController } from '../controllers/job-recommendations.controller.js';
import { JobOfferNotFoundException } from '../exceptions/index.js';
import { JobRecommendationsService } from '../services/job-recommendations.service.js';

const OFFER_ID = '3f2b8a54-6d2e-4c7e-9a41-0b1d5f6c7e88';

describe('JobRecommendationsController: GET /job-offers/:id/match', () => {
  const service = { getRecommendations: vi.fn(), getJobFit: vi.fn() };
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [JobRecommendationsController],
      providers: [{ provide: JobRecommendationsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest().user = { id: 'user-id' };
          return true;
        },
      })
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterAll(() => app.close());
  beforeEach(() => vi.resetAllMocks());

  it('con un id inválido responde 400 con el formato de errores de la API', async () => {
    const res = await request(app.getHttpServer()).get('/job-offers/abc/match');

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      statusCode: 400,
      ok: false,
      errors: [{ field: 'id', message: 'El identificador de la vacante no es valido' }],
    });
    expect(service.getJobFit).not.toHaveBeenCalled();
  });

  it('con una vacante que no existe responde 404 con la excepción de dominio', async () => {
    service.getJobFit.mockRejectedValue(new JobOfferNotFoundException());

    const res = await request(app.getHttpServer()).get(`/job-offers/${OFFER_ID}/match`);

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      statusCode: 404,
      ok: false,
      detail: 'La vacante no existe o no está publicada.',
    });
  });

  it('con una vacante publicada responde 200 y pasa el usuario autenticado al servicio', async () => {
    service.getJobFit.mockResolvedValue({ jobOfferId: OFFER_ID, score: 50 });

    const res = await request(app.getHttpServer()).get(`/job-offers/${OFFER_ID}/match`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ jobOfferId: OFFER_ID, score: 50 });
    expect(service.getJobFit).toHaveBeenCalledWith('user-id', OFFER_ID);
  });

  it('la ruta fija recommendations no se confunde con un id', async () => {
    service.getRecommendations.mockResolvedValue({ isProfileComplete: false, items: [] });

    const res = await request(app.getHttpServer()).get('/job-offers/recommendations');

    expect(res.status).toBe(200);
    expect(service.getRecommendations).toHaveBeenCalledWith('user-id');
    expect(service.getJobFit).not.toHaveBeenCalled();
  });
});
