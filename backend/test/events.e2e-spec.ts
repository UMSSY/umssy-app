import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import request from 'supertest';
import type { App } from 'supertest/types';
import { vi } from 'vitest';
import { EventsModule } from '../src/modules/events/events.module.js';
import { PrismaModule } from '../src/common/prisma/prisma.module.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor.js';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter.js';
import { DomainExceptionFilter } from '../src/common/filters/domain-exception.filter.js';

function buildPrismaEventRecord(overrides = {}) {
  return {
    id: 'evt-001',
    title: 'Taller de Node.js',
    description: 'Aprende Node',
    categoryId: 'cat-001',
    instructorName: 'Ana Garcia',
    eventDate: new Date('2026-09-01T00:00:00.000Z'),
    startTime: new Date('1970-01-01T09:00:00.000Z'),
    endTime: new Date('1970-01-01T11:00:00.000Z'),
    location: 'Sala B',
    capacity: 30,
    statusId: 'status-001',
    modalityId: 'modality-001',
    category: { id: 'cat-001', name: 'Tecnologia' },
    _count: { registrations: 10 },
    ...overrides,
  };
}

const findManyMock = vi.fn().mockResolvedValue([buildPrismaEventRecord()]);
const countMock = vi.fn().mockResolvedValue(1);

const prismaMock = {
  event: {
    findMany: findManyMock,
    count: countMock,
  },
  $transaction: vi.fn().mockImplementation((promises) => Promise.all(promises)),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

describe('EventsController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [EventsModule, PrismaModule],
      providers: [
        { provide: APP_FILTER, useClass: HttpExceptionFilter },
        { provide: APP_FILTER, useClass: DomainExceptionFilter },
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    vi.clearAllMocks();
    if (app) {
      await app.close();
    }
  });

  it('GET /api/events - returns paginated list with data.items, total, limit, and totalPages', async () => {
    findManyMock.mockResolvedValueOnce([buildPrismaEventRecord()]);
    countMock.mockResolvedValueOnce(1);

    const res = await request(app.getHttpServer())
      .get('/api/events')
      .expect(200);

    expect(res.body).toMatchObject({
      statusCode: 200,
      ok: true,
      detail: 'Operación exitosa',
      page: 1,
      offset: 0,
      data: {
        total: 1,
        limit: 10,
        totalPages: 1,
      },
    });
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items[0]).toMatchObject({
      id: 'evt-001',
      title: 'Taller de Node.js',
      eventDate: '2026-09-01',
      startTime: '09:00',
      endTime: '11:00',
      availableSpots: 20,
      registeredCount: 10,
      category: { id: 'cat-001', name: 'Tecnologia' },
    });
  });

  it('GET /api/events?search=Node - filters by title search term', async () => {
    findManyMock.mockResolvedValueOnce([buildPrismaEventRecord()]);
    countMock.mockResolvedValueOnce(1);

    const res = await request(app.getHttpServer())
      .get('/api/events?search=Node')
      .expect(200);

    expect(res.body.statusCode).toBe(200);
    expect(res.body.data.total).toBe(1);
    expect(prismaMock.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          title: { contains: 'Node', mode: 'insensitive' },
        }),
      }),
    );
  });

  it('GET /api/events?categoryId=123e4567-e89b-12d3-a456-426614174000 - filters by categoryId', async () => {
    findManyMock.mockResolvedValueOnce([buildPrismaEventRecord()]);
    countMock.mockResolvedValueOnce(1);

    const res = await request(app.getHttpServer())
      .get('/api/events?categoryId=123e4567-e89b-12d3-a456-426614174000')
      .expect(200);

    expect(res.body.statusCode).toBe(200);
    expect(prismaMock.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
        }),
      }),
    );
  });

  it('GET /api/events?search=Node&categoryId=123e4567-e89b-12d3-a456-426614174000 - combines search and categoryId', async () => {
    findManyMock.mockResolvedValueOnce([buildPrismaEventRecord()]);
    countMock.mockResolvedValueOnce(1);

    const res = await request(app.getHttpServer())
      .get('/api/events?search=Node&categoryId=123e4567-e89b-12d3-a456-426614174000')
      .expect(200);

    expect(res.body.statusCode).toBe(200);
    expect(prismaMock.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          title: { contains: 'Node', mode: 'insensitive' },
        },
      }),
    );
  });

  it('GET /api/events?search=100%25 - handles special characters like percent sign', async () => {
    findManyMock.mockResolvedValueOnce([]);
    countMock.mockResolvedValueOnce(0);

    const res = await request(app.getHttpServer())
      .get('/api/events?search=100%25')
      .expect(200);

    expect(res.body.statusCode).toBe(200);
    expect(res.body.data.total).toBe(0);
    expect(prismaMock.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          title: { contains: '100%', mode: 'insensitive' },
        }),
      }),
    );
  });

  it('GET /api/events?page=2&limit=5 - respects pagination parameters and calculates offset', async () => {
    findManyMock.mockResolvedValueOnce([]);
    countMock.mockResolvedValueOnce(0);

    const res = await request(app.getHttpServer())
      .get('/api/events?page=2&limit=5')
      .expect(200);

    expect(res.body.page).toBe(2);
    expect(res.body.offset).toBe(5);
    expect(res.body.data.total).toBe(0);
    expect(res.body.data.limit).toBe(5);
    expect(res.body.data.totalPages).toBe(0);
    expect(res.body.data.items).toHaveLength(0);
  });

  it('GET /api/events?limit=100 - rejects limit greater than MAX_PAGE_SIZE (50)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/events?limit=100')
      .expect(400);

    expect(res.body.ok).toBe(false);
  });

  it('GET /api/events?search=... - rejects search greater than MAX_SEARCH_LENGTH (150)', async () => {
    const longSearch = 'a'.repeat(151);
    const res = await request(app.getHttpServer())
      .get(`/api/events?search=${longSearch}`)
      .expect(400);

    expect(res.body.ok).toBe(false);
  });

  it('GET /api/events?page=0 - rejects page less than 1', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/events?page=0')
      .expect(400);

    expect(res.body.ok).toBe(false);
  });

  it('GET /api/events?categoryId=invalid - rejects invalid UUID', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/events?categoryId=not-a-uuid')
      .expect(400);

    expect(res.body.ok).toBe(false);
  });
});
