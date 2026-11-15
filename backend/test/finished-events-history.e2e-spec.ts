import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { DomainExceptionFilter } from '../src/common/filters/domain-exception.filter.js';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor.js';
import { PrismaModule } from '../src/common/prisma/prisma.module.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { EventRegistrationsModule } from '../src/modules/event-registrations/event-registrations.module.js';

const registrations = [
  {
    id: 'reg-a-3',
    userId: 'user-a',
    eventId: 'event-a-3',
    registeredAt: new Date('2026-09-15T12:00:00.000Z'),
    cancelledAt: null,
    status: { title: 'Confirmada' },
    event: {
      title: 'Workshop A3',
      eventDate: new Date('2026-09-15T00:00:00.000Z'),
      startTime: new Date('1970-01-01T09:00:00.000Z'),
      endTime: new Date('1970-01-01T12:00:00.000Z'),
      location: 'Room A',
    },
  },
  {
    id: 'reg-a-2',
    userId: 'user-a',
    eventId: 'event-a-2',
    registeredAt: new Date('2026-08-20T12:00:00.000Z'),
    cancelledAt: null,
    status: { title: 'Confirmada' },
    event: {
      title: 'Workshop A2',
      eventDate: new Date('2026-08-20T00:00:00.000Z'),
      startTime: new Date('1970-01-01T09:00:00.000Z'),
      endTime: new Date('1970-01-01T12:00:00.000Z'),
      location: null,
    },
  },
  {
    id: 'reg-a-1',
    userId: 'user-a',
    eventId: 'event-a-1',
    registeredAt: new Date('2026-08-10T12:00:00.000Z'),
    cancelledAt: null,
    status: { title: 'Confirmada' },
    event: {
      title: 'Workshop A1',
      eventDate: new Date('2026-08-10T00:00:00.000Z'),
      startTime: new Date('1970-01-01T09:00:00.000Z'),
      endTime: new Date('1970-01-01T12:00:00.000Z'),
      location: 'Room B',
    },
  },
  {
    id: 'reg-b-1',
    userId: 'user-b',
    eventId: 'event-b-1',
    registeredAt: new Date('2026-09-01T12:00:00.000Z'),
    cancelledAt: null,
    status: { title: 'Confirmada' },
    event: {
      title: 'Workshop B1',
      eventDate: new Date('2026-09-01T00:00:00.000Z'),
      startTime: new Date('1970-01-01T09:00:00.000Z'),
      endTime: new Date('1970-01-01T12:00:00.000Z'),
      location: 'Room C',
    },
  },
];

describe('GET /api/event-registrations/me finished history', () => {
  let app: INestApplication;
  const findMany = vi.fn();
  const count = vi.fn();
  const verifyAsync = vi.fn().mockImplementation(async (token) => {
    if (token === 'invalid' || token === 'expired') {
      throw new Error('Invalid token');
    }
    return { sub: token, roleTag: 'titulado' };
  });

  beforeAll(async () => {
    findMany.mockImplementation(async ({ where, skip, take }) => {
      const mine = registrations.filter((item) => item.userId === where.userId);
      return (skip === undefined ? mine : mine.slice(skip, skip + take)).map(
        ({ userId: _userId, ...item }) => item,
      );
    });
    count.mockImplementation(
      async ({ where }) =>
        registrations.filter((item) => item.userId === where.userId).length,
    );
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, EventRegistrationsModule],
    })
      .overrideProvider(JwtService)
      .useValue({ verifyAsync })
      .overrideProvider(PrismaService)
      .useValue({
        eventRegistration: { findMany, count },
        user: {
          findFirst: vi.fn().mockImplementation(async ({ where }) => ({
            id: where.id,
            email: `${where.id}@test.com`,
            isActive: true,
            company: null,
            roles: [{ role: { name: 'titulado' } }],
          })),
        },
        $transaction: vi
          .fn()
          .mockImplementation((queries) => Promise.all(queries)),
      })
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new DomainExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  beforeEach(() => {
    findMany.mockClear();
    count.mockClear();
  });

  afterAll(async () => {
    if (app) await app.close();
    vi.restoreAllMocks();
  });

  it('returns only the authenticated user history with private cache headers', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/event-registrations/me?scope=finished')
      .set('Authorization', 'Bearer user-a')
      .expect(200);

    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(response.body.data.items.map((item) => item.id)).toEqual([
      'reg-a-3',
      'reg-a-2',
      'reg-a-1',
    ]);
    expect(response.body.data).toMatchObject({
      total: 3,
      limit: 10,
      totalPages: 1,
    });
    expect(response.body).toMatchObject({ page: 1, offset: 0 });
    expect(findMany.mock.calls[0][0].where.userId).toBe('user-a');
    expect(count.mock.calls[0][0].where.userId).toBe('user-a');
    expect(JSON.stringify(response.body)).not.toContain('reg-b-1');
  });

  it('uses the second user token and ignores an injected userId query', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/event-registrations/me?scope=finished&userId=user-a')
      .set('Authorization', 'Bearer user-b')
      .expect(200);

    expect(response.body.data.items.map((item) => item.id)).toEqual([
      'reg-b-1',
    ]);
    expect(findMany.mock.calls[0][0].where.userId).toBe('user-b');
    expect(count.mock.calls[0][0].where.userId).toBe('user-b');
    expect(JSON.stringify(response.body)).not.toContain('reg-a-');
  });

  it('returns an empty page for a user without history', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/event-registrations/me?scope=finished')
      .set('Authorization', 'Bearer user-empty')
      .expect(200);

    expect(response.body).toMatchObject({
      data: { items: [], total: 0, limit: 10, totalPages: 0 },
      page: 1,
      offset: 0,
    });
  });

  it('paginates without repeated items', async () => {
    const first = await request(app.getHttpServer())
      .get('/api/event-registrations/me?scope=finished&page=1&limit=2')
      .set('Authorization', 'Bearer user-a')
      .expect(200);
    const second = await request(app.getHttpServer())
      .get('/api/event-registrations/me?scope=finished&page=2&limit=2')
      .set('Authorization', 'Bearer user-a')
      .expect(200);

    expect(first.body.data.items.map((item) => item.id)).toEqual([
      'reg-a-3',
      'reg-a-2',
    ]);
    expect(second.body.data.items.map((item) => item.id)).toEqual(['reg-a-1']);
    expect(second.body).toMatchObject({
      data: { total: 3, limit: 2, totalPages: 2 },
      page: 2,
      offset: 2,
    });
  });

  it('preserves the legacy array response without scope', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/event-registrations/me')
      .set('Authorization', 'Bearer user-a')
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.map((item) => item.id)).toEqual([
      'reg-a-3',
      'reg-a-2',
      'reg-a-1',
    ]);
    expect(response.body).not.toHaveProperty('page');
    expect(response.body).not.toHaveProperty('offset');
    expect(response.headers['cache-control']).toBe('private, no-store');
  });

  it('rejects an invalid scope without querying registrations', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/event-registrations/me?scope=other')
      .set('Authorization', 'Bearer user-a')
      .expect(400);

    expect(response.body).toMatchObject({
      code: 'VALIDATION_ERROR',
      data: null,
    });
    expect(findMany).not.toHaveBeenCalled();
    expect(count).not.toHaveBeenCalled();
  });

  it('requires a valid token before querying registrations', async () => {
    for (const authorization of [
      undefined,
      'Bearer invalid',
      'Bearer expired',
    ]) {
      const operation = request(app.getHttpServer()).get(
        '/api/event-registrations/me?scope=finished',
      );
      const response = await (
        authorization
          ? operation.set('Authorization', authorization)
          : operation
      ).expect(401);
      expect(response.body).toMatchObject({
        code: 'UNAUTHENTICATED',
        data: null,
      });
    }
    expect(findMany).not.toHaveBeenCalled();
    expect(count).not.toHaveBeenCalled();
  });
});
