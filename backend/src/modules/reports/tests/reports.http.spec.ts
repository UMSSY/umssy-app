import type { INestApplication } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { ReportsController } from '../controllers/reports.controller.js';
import { GeneratedReportsRepository } from '../repositories/generated-reports.repository.js';
import { ReportUsersRepository } from '../repositories/report-users.repository.js';
import { ReportHistoryService } from '../services/report-history.service.js';
import { ReportsService } from '../services/reports.service.js';

describe('ReportsController (HTTP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        ReportsService,
        ReportUsersRepository,
        ReportHistoryService,
        GeneratedReportsRepository,
        { provide: APP_PIPE, useClass: ZodValidationPipe },
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde con el formato estándar y la página validada', async () => {
    const response = await request(app.getHttpServer()).get(
      '/reports/registered-users?page=1&limit=5',
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      statusCode: 200,
      page: 1,
      detail: 'Usuarios registrados obtenidos correctamente',
      ok: true,
    });
  });

  it('responde 400 indicando el campo inválido', async () => {
    const response = await request(app.getHttpServer()).get(
      '/reports/registered-users?page=0',
    );

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      data: null,
      ok: false,
    });
    expect(response.body.detail).toBe(
      'page: La página debe ser mayor o igual a 1',
    );
  });

  it('expone Content-Disposition en la descarga del CSV', async () => {
    const response = await request(app.getHttpServer()).get(
      '/reports/registered-users/export',
    );

    expect(response.status).toBe(200);
    expect(response.headers['access-control-expose-headers']).toBe(
      'Content-Disposition',
    );
    expect(response.headers['content-disposition']).toContain('attachment');
  });
});
