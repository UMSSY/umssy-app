import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { describe, expect, it } from 'vitest';
import { documentCommonResponses } from '../../../common/utils/document-common-responses.js';
import { SessionService } from '../../../common/services/session.service.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CompaniesController } from '../controllers/companies.controller.js';
import { CompaniesService } from '../services/companies.service.js';

async function buildDocument() {
  const moduleRef = await Test.createTestingModule({
    controllers: [CompaniesController],
    providers: [
      { provide: CompaniesService, useValue: {} },
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

describe('companies OpenAPI contracts', () => {
  it('documents the company profile endpoint with UUID param, response and errors', async () => {
    const document = await buildDocument();
    const profile = document.paths['/api/companies/{companyId}/profile']?.get;

    expect(profile?.operationId).toBe('getCompanyProfile');
    const params = JSON.stringify(profile?.parameters);
    expect(params).toContain('"name":"companyId"');
    expect(params).toContain('"format":"uuid"');
    expect(JSON.stringify(profile?.responses['200'])).toContain('logoUrl');
    for (const status of ['400', '401', '403', '404', '500']) {
      expect(profile?.responses[status]).toBeDefined();
    }
    expect(JSON.stringify(profile?.responses['404'])).toContain(
      'COMPANY_NOT_FOUND',
    );
  });

  it('documents the public featured companies endpoint', async () => {
    const document = await buildDocument();
    const featured = document.paths['/api/companies/featured']?.get;

    expect(featured?.operationId).toBe('listFeaturedCompanies');
    expect(featured?.security).toBeUndefined();
    const ok = JSON.stringify(featured?.responses['200']);
    expect(ok).toContain('activeVacanciesCount');
    expect(ok).toContain('sector');
    expect(featured?.responses['500']).toBeDefined();
    expect(featured?.responses['401']).toBeUndefined();
  });
});
