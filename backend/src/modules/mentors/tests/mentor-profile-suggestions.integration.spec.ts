import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('compiled MentorsModule suggestions integration', () => {
  it('initializes the real module graph and serves authenticated suggestions with production injection metadata', () => {
    execFileSync(
      process.execPath,
      ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.build.json'],
      { timeout: 60000, stdio: 'pipe' },
    );
    const output = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `
      import 'reflect-metadata';
      import assert from 'node:assert/strict';
      import { Test } from '@nestjs/testing';
      import { JwtService } from '@nestjs/jwt';
      import request from 'supertest';
      import { MentorsModule } from './dist/modules/mentors/mentors.module.js';
      import { MentorsService } from './dist/modules/mentors/services/mentors.service.js';
      import { MentorProfileSuggestionsService } from './dist/modules/mentors/services/mentor-profile-suggestions.service.js';
      import { PrismaService } from './dist/common/prisma/prisma.service.js';
      import { ResponseInterceptor } from './dist/common/interceptors/response.interceptor.js';
      import { DomainExceptionFilter } from './dist/common/filters/domain-exception.filter.js';
      const reads = [];
      const prisma = { user: { findFirst: async ({ where, select }) => {
        reads.push(where.id);
        if (select.roles) return { id: where.id, email: 'mentor@test.com', isActive: true, company: null, roles: [{ role: { name: 'mentor' } }] };
        return { photoUrl: null, aboutMe: null, mentorTechnicalAreas: [], workExperiences: [] };
      } } };
      const module = await Test.createTestingModule({ imports: [MentorsModule] })
        .overrideProvider(PrismaService).useValue(prisma).compile();
      const app = module.createNestApplication({ logger: false });
      try {
        app.setGlobalPrefix('api');
        app.useGlobalInterceptors(new ResponseInterceptor());
        app.useGlobalFilters(new DomainExceptionFilter());
        await app.init();
        assert.ok(module.get(MentorsService) instanceof MentorsService);
        assert.ok(module.get(MentorProfileSuggestionsService) instanceof MentorProfileSuggestionsService);
        const path = '/api/mentors/me/profile-suggestions';
        await request(app.getHttpServer()).get(path).expect(401);
        assert.equal(reads.length, 0);
        const token = module.get(JwtService).sign({ sub: 'mentor-integration', roleTag: 'mentor', roles: ['mentor'] });
        const result = await request(app.getHttpServer()).get(path).auth(token, { type: 'bearer' }).expect(200);
        assert.equal(result.body.data.pendingCount, 4);
        assert.equal(result.body.data.suggestions.length, 4);
        assert.equal(result.body.ok, true);
        assert.deepEqual(reads, ['mentor-integration', 'mentor-integration']);
        console.log('MentorsModule initialized with real DI and JWT guard');
      } finally { await app.close(); }
    `,
      ],
      {
        timeout: 60000,
        encoding: 'utf8',
        env: {
          ...process.env,
          NODE_ENV: 'test',
          JWT_SECRET: 'hu13-module-integration-secret',
        },
      },
    );
    expect(output).toContain(
      'MentorsModule initialized with real DI and JWT guard',
    );
  }, 120000);
});
