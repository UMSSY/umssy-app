import type { INestApplication } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { SessionModule } from '../../../common/session/session.module.js';
import { ProfileNotFoundException } from '../../profile/exceptions/profile-not-found.exception.js';
import { ProfileSkillsAnalysisController } from '../controllers/profile-skills-analysis.controller.js';
import { ProfileSkillsAnalysisService } from '../services/profile-skills-analysis.service.js';

const userId = '11111111-1111-4111-8111-111111111111';
const snapshot = {
  userId,
  status: 'ready',
  version: 1,
  updatedAt: '2026-10-23T12:00:00.000Z',
  dictionaryVersion: '1.0.0',
  skills: [],
};

describe('ProfileSkillsAnalysisController', () => {
  let app: INestApplication;
  let token: string;
  let service: { getRadarSnapshot: ReturnType<typeof vi.fn>; analyzeNow: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    service = {
      getRadarSnapshot: vi.fn().mockResolvedValue(snapshot),
      analyzeNow: vi.fn().mockResolvedValue({ ...snapshot, analysis: { discarded: [], rejectedSources: [] } }),
    };
    const moduleRef = await Test.createTestingModule({
      imports: [SessionModule, JwtModule.register({ global: true, secret: 'nlp-test-secret' })],
      controllers: [ProfileSkillsAnalysisController],
      providers: [
        { provide: ProfileSkillsAnalysisService, useValue: service },
        { provide: APP_FILTER, useClass: DomainExceptionFilter },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findFirst: ({ where }: { where: { id: string } }) =>
            Promise.resolve({ id: where.id, email: 'user@test.com', roles: [{ role: { name: 'titulado' } }] }),
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    token = moduleRef.get(JwtService).sign({ sub: userId, roleTag: 'titulado' });
  });

  afterEach(async () => {
    await app.close();
  });

  it('serves the stored skills of the token user for the radar', async () => {
    const response = await request(app.getHttpServer())
      .get('/profile/skills-for-radar')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({ statusCode: 200, data: snapshot, detail: 'OK', ok: true });
    expect(service.getRadarSnapshot).toHaveBeenCalledWith(userId);
  });

  it('runs the analysis again for the token user', async () => {
    const response = await request(app.getHttpServer())
      .post('/profile/me/skills/analysis')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data.analysis).toEqual({ discarded: [], rejectedSources: [] });
    expect(service.analyzeNow).toHaveBeenCalledWith(userId);
  });

  it.each([
    ['get', '/profile/skills-for-radar'],
    ['post', '/profile/me/skills/analysis'],
  ] as const)('answers 401 to %s %s without a session', async (method, path) => {
    await request(app.getHttpServer())[method](path).expect(401);
    expect(service.getRadarSnapshot).not.toHaveBeenCalled();
    expect(service.analyzeNow).not.toHaveBeenCalled();
  });

  it('answers 401 to an invalid token', async () => {
    await request(app.getHttpServer())
      .get('/profile/skills-for-radar')
      .set('Authorization', 'Bearer not-a-token')
      .expect(401);
  });

  it('answers 404 when the profile does not exist', async () => {
    service.getRadarSnapshot.mockRejectedValue(new ProfileNotFoundException());

    const response = await request(app.getHttpServer())
      .get('/profile/skills-for-radar')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.body.ok).toBe(false);
  });
});
