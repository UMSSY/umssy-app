import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { EventsModule } from '../events.module.js';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const KEY = '22222222-2222-4222-8222-222222222222';
const COVER = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64');
const VALID = { title: 'Python', description: 'Taller práctico', categoryId: USER_ID, eventDate: '2027-12-12', startTime: '09:00', endTime: '12:00', capacity: '31', modality: 'presencial', location: 'Aula 1' };
let app: INestApplication;
let token: string;
let record: Record<string, unknown>;
let prisma: ReturnType<typeof fixture>;
function fixture() {
  const tx = {
    user: { findFirst: vi.fn().mockResolvedValue({ firstName: 'Ana', lastName: 'López' }) },
    eventCategory: { findUnique: vi.fn().mockResolvedValue({ id: USER_ID }) },
    eventStatus: { upsert: vi.fn().mockResolvedValue({ id: 'status' }) },
    eventOrigin: { upsert: vi.fn().mockResolvedValue({ id: 'origin' }) },
    eventModality: { upsert: vi.fn().mockResolvedValue({ id: 'modality' }) },
    event: { create: vi.fn().mockImplementation(async ({ data }) => { record = { ...data, id: KEY }; return record; }) },
  };
  return {
    tx,
    user: { findFirst: vi.fn().mockResolvedValue({ id: USER_ID, email: 'user@example.test', isActive: true, roles: [{ role: { name: 'titulado' } }] }) },
    event: { findUnique: vi.fn().mockResolvedValue(null), findFirst: vi.fn().mockResolvedValue(null) },
    $transaction: vi.fn(async (fn) => fn(tx)),
  };
}
beforeEach(async () => {
  prisma = fixture();
  const jwt = new JwtService({ secret: 'proposal-http-test-secret' });
  token = jwt.sign({ sub: USER_ID, roleTag: 'titulado' });
  const moduleRef = await Test.createTestingModule({
    imports: [EventsModule],
    providers: [{ provide: APP_FILTER, useClass: DomainExceptionFilter }, { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor }],
  }).overrideProvider(PrismaService).useValue(prisma).overrideProvider(JwtService).useValue(jwt).compile();
  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  await app.init();
});
afterEach(async () => { await app?.close(); vi.restoreAllMocks(); });
function submit(values = VALID, key: string | null = KEY, cover: Buffer | null = COVER) {
  const req = request(app.getHttpServer()).post('/api/event-proposals').set('Authorization', `Bearer ${token}`);
  if (key !== null) req.set('Idempotency-Key', key);
  for (const [field, value] of Object.entries(values)) req.field(field, value);
  if (cover !== null) req.attach('cover', cover, 'cover.png');
  return req;
}
describe('proposal errors through the shared HTTP filter', () => {
  it('preserves multiple field errors and does not persist invalid proposals', async () => {
    const { body } = await submit({ ...VALID, title: '', endTime: '08:00' }).expect(400);
    expect(body).toMatchObject({ ok: false, code: 'VALIDATION_ERROR', statusCode: 400, data: expect.any(Array) });
    expect(body.errors).toEqual(expect.arrayContaining([{ field: 'title', message: expect.any(String) }, { field: 'endTime', message: expect.any(String) }]));
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it.each([null, 'invalid'])('identifies an invalid idempotency header: %s', async (key) => {
    const { body } = await submit(VALID, key).expect(400);
    expect(body).toMatchObject({ code: 'VALIDATION_ERROR', errors: [{ field: 'idempotencyKey', message: expect.any(String) }] });
  });
  it('associates missing categories with categoryId', async () => {
    prisma.tx.eventCategory.findUnique.mockResolvedValue(null);
    const { body } = await submit().expect(400);
    expect(body).toMatchObject({ code: 'VALIDATION_ERROR', errors: [{ field: 'categoryId', message: 'Selecciona una categoría disponible.' }] });
    expect(prisma.tx.event.create).not.toHaveBeenCalled();
  });
  it('preserves success, replay and the domain conflict response', async () => {
    const first = await submit().expect(201);
    prisma.event.findUnique.mockResolvedValue(record);
    expect((await submit().expect(201)).body).toEqual(first.body);
    const { body } = await submit({ ...VALID, title: 'Otro taller' }).expect(409);
    expect(body).toMatchObject({ ok: false, statusCode: 409, code: 'PROPOSAL_KEY_CONFLICT', detail: 'La clave de envío ya corresponde a otra propuesta.' });
    expect(prisma.tx.event.create).toHaveBeenCalledTimes(1);
  });
  it('preserves author permission errors', async () => {
    prisma.tx.user.findFirst.mockResolvedValue(null);
    expect((await submit().expect(403)).body).toMatchObject({ code: 'FORBIDDEN_ROLE', detail: 'Solo un titulado activo puede proponer talleres.' });
  });
  it.each([[null, 400, 'EMPTY_FILE'], [Buffer.from('invalid image'), 415, 'INVALID_FILE_TYPE'], [Buffer.concat([COVER.subarray(0, 16), Buffer.alloc(64)]), 400, 'CORRUPTED_FILE']] as const)('preserves upload errors: %s', async (cover, status, code) => {
    expect((await submit(VALID, KEY, cover).expect(status)).body).toMatchObject({ code, ok: false });
    expect(prisma.tx.event.create).not.toHaveBeenCalled();
  });
  it('returns a domain error for a missing cover', async () => {
    expect((await request(app.getHttpServer()).get(`/api/events/${KEY}/cover`).expect(404)).body).toMatchObject({ code: 'PROPOSAL_COVER_NOT_FOUND', detail: 'Portada no disponible.' });
  });
});
