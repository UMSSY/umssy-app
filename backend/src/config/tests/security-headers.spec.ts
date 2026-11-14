import { Controller, Get, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { securityHeaders } from '../security-headers.config.js';

@Controller()
class ProbeController {
  @Get('api/probe')
  api() {
    return { ok: true };
  }

  @Get('docs')
  docs() {
    return 'docs';
  }

  @Get('docs/swagger-ui-init.js')
  docsAsset() {
    return 'asset';
  }

  @Get('documents')
  documents() {
    return 'documents';
  }
}

describe('securityHeaders', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use(securityHeaders);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('applies a strict content security policy to API responses', async () => {
    const response = await request(app.getHttpServer()).get('/api/probe');

    expect(response.status).toBe(200);
    expect(response.headers['content-security-policy']).toContain(
      "default-src 'none'",
    );
    expect(response.headers['content-security-policy']).toContain(
      "frame-ancestors 'none'",
    );
  });

  it('adds the standard hardening headers and hides the framework', async () => {
    const response = await request(app.getHttpServer()).get('/api/probe');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['strict-transport-security']).toBeDefined();
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('lets the frontend on a sibling subdomain load API resources', async () => {
    const response = await request(app.getHttpServer()).get('/api/probe');

    expect(response.headers['cross-origin-resource-policy']).toBe('same-site');
  });

  it.each(['/docs', '/docs/swagger-ui-init.js'])(
    'does not restrict the Swagger UI at %s',
    async (path) => {
      const response = await request(app.getHttpServer()).get(path);

      expect(response.status).toBe(200);
      expect(response.headers['content-security-policy']).toBeUndefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    },
  );

  it('does not treat other paths that start with the docs prefix as Swagger', async () => {
    const response = await request(app.getHttpServer()).get('/documents');

    expect(response.headers['content-security-policy']).toContain(
      "default-src 'none'",
    );
  });
});
