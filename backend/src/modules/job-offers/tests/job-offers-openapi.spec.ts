import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { describe, expect, it } from 'vitest';
import { documentCommonResponses } from '../../../common/utils/document-common-responses.js';
import { SessionService } from '../../../common/services/session.service.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { JobOffersController } from '../controllers/job-offers.controller.js';
import { JobOffersService } from '../services/job-offers.service.js';

async function buildDocument() {
  const moduleRef = await Test.createTestingModule({
    controllers: [JobOffersController],
    providers: [
      { provide: JobOffersService, useValue: {} },
      { provide: JwtService, useValue: {} },
      { provide: SessionService, useValue: {} },
      JwtAuthGuard,
    ],
  }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  await app.init();
  try {
    return documentCommonResponses(
      SwaggerModule.createDocument(
        app,
        new DocumentBuilder().addBearerAuth().build(),
      ),
    );
  } finally {
    await app.close();
  }
}

describe('job offers OpenAPI contracts', () => {
  it('documents the manual close endpoint with UUID params, response and errors', async () => {
    const document = await buildDocument();
    const close =
      document.paths[
        '/api/companies/{companyId}/job-offers/{jobOfferId}/close'
      ]?.patch;

    expect(close?.operationId).toBe('closeCompanyJobOffer');
    const params = JSON.stringify(close?.parameters);
    expect(params).toContain('"name":"companyId"');
    expect(params).toContain('"name":"jobOfferId"');
    expect(params).toContain('"format":"uuid"');
    expect(JSON.stringify(close?.responses['200'])).toContain('Cerrada');
    for (const status of ['400', '401', '403', '404', '409', '500']) {
      expect(close?.responses[status]).toBeDefined();
    }
    expect(JSON.stringify(close?.responses['409'])).toContain(
      'JOB_OFFER_NOT_CLOSABLE',
    );
    expect(JSON.stringify(close?.responses['404'])).toContain(
      'JOB_OFFER_NOT_FOUND',
    );
  });

  it('documents expiresAt and the 422 for a past closing date when publishing', async () => {
    const document = await buildDocument();
    const create = document.paths['/api/companies/{companyId}/job-offers']?.post;

    expect(JSON.stringify(create?.requestBody)).toContain('expiresAt');
    expect(JSON.stringify(create?.requestBody)).toContain(
      'cierre automático',
    );
    expect(JSON.stringify(create?.responses['422'])).toContain(
      'JOB_OFFER_EXPIRY_IN_PAST',
    );
  });
});
