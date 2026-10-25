import type { INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { DomainExceptionFilter } from '../src/common/filters/domain-exception.filter.js';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { EventRegistrationsModule } from '../src/modules/event-registrations/index.js';
import { EventsService } from '../src/modules/events/index.js';
import { createRegistrationDatabaseFixture } from './fixtures/registration-database.fixture.js';

const DATABASE = process.env.REGISTRATIONS_E2E_DATABASE;
const REQUEST_TIMEOUT = 10_000;

describe.skipIf(!DATABASE)('registration persistence and concurrent HTTP requests', () => {
  let app: INestApplication;
  let fixture: Awaited<ReturnType<typeof createRegistrationDatabaseFixture>>;
  let tokens: string[];

  beforeAll(async () => {
    fixture = await createRegistrationDatabaseFixture();
    const jwt = new JwtService({ secret: 'registration-database-test-secret' });
    tokens = fixture.users.map((user) => jwt.sign({ sub: user.id, roleTag: 'titulado' }));
    const moduleRef = await Test.createTestingModule({
      imports: [EventRegistrationsModule],
      providers: [
        { provide: APP_FILTER, useClass: DomainExceptionFilter },
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
      ],
    }).overrideProvider(PrismaService).useValue(fixture.client)
      .overrideProvider(JwtService).useValue(jwt).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  }, 30_000);

  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => {
    await app?.close();
    await fixture?.cleanup();
  });

  const create = (eventId: string, user = 0) => request(app.getHttpServer())
    .post(`/api/events/${eventId}/registrations`).set('Authorization', `Bearer ${tokens[user]}`).timeout(REQUEST_TIMEOUT);
  const cancel = (id: string, user = 0) => request(app.getHttpServer())
    .delete(`/api/registrations/${id}`).set('Authorization', `Bearer ${tokens[user]}`).timeout(REQUEST_TIMEOUT);

  function synchronizeEventReads() {
    const service = app.get(EventsService);
    const read = service.findForRegistration.bind(service);
    let arrived = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const timer = setTimeout(release, 5_000);
    vi.spyOn(service, 'findForRegistration').mockImplementation(async (...args) => {
      const event = await read(...args);
      arrived += 1;
      if (arrived >= 2) { clearTimeout(timer); release(); }
      await gate;
      return event;
    });
    return () => { clearTimeout(timer); release(); expect(arrived).toBeGreaterThanOrEqual(2); };
  }

  it('persists cancellation and reactivation on the same row with a new QR', async () => {
    const event = await fixture.createEvent();
    const created = (await create(event.id).expect(201)).body.data;
    await cancel(created.id).expect(200);
    const cancelled = await fixture.client.eventRegistration.findUniqueOrThrow({ where: { id: created.id }, include: { status: true } });
    expect(cancelled.status.title).toBe('Cancelada');
    expect(cancelled.cancelledAt).not.toBeNull();
    const own = await request(app.getHttpServer()).get(`/api/events/${event.id}/registrations/me`).set('Authorization', `Bearer ${tokens[0]}`).expect(200);
    expect(own.body.data.status).toBe('cancelled');
    const reactivated = (await create(event.id).expect(201)).body.data;
    expect(reactivated).toMatchObject({ id: created.id, registeredAt: created.registeredAt, status: 'confirmed', cancelledAt: null });
    expect(reactivated.qrToken).not.toBe(created.qrToken);
    expect(await fixture.client.eventRegistration.count({ where: { eventId: event.id } })).toBe(1);
  });

  it('allows only one concurrent request for the last available seat', async () => {
    const event = await fixture.createEvent();
    const verifyOverlap = synchronizeEventReads();
    const responses = await Promise.all([create(event.id, 0), create(event.id, 1)]);
    verifyOverlap();
    expect(responses.map((response) => response.status).sort((left, right) => left - right)).toEqual([201, 409]);
    expect(responses.find((response) => response.status === 409)?.body.code).toBe('EVENT_FULL');
    expect(await fixture.client.eventRegistration.count({ where: { eventId: event.id, cancelledAt: null } })).toBe(1);
  }, 20_000);

  it('normalizes concurrent duplicate requests without creating a second row', async () => {
    const event = await fixture.createEvent(null);
    const verifyOverlap = synchronizeEventReads();
    const responses = await Promise.all([create(event.id), create(event.id)]);
    verifyOverlap();
    expect(responses.map((response) => response.status).sort((left, right) => left - right)).toEqual([201, 409]);
    expect(responses.find((response) => response.status === 409)?.body.code).toBe('ALREADY_REGISTERED');
    expect(await fixture.client.eventRegistration.count({ where: { eventId: event.id } })).toBe(1);
  }, 20_000);

  it('allows only one concurrent cancellation', async () => {
    const event = await fixture.createEvent();
    const created = (await create(event.id).expect(201)).body.data;
    const verifyOverlap = synchronizeEventReads();
    const responses = await Promise.all([cancel(created.id), cancel(created.id)]);
    verifyOverlap();
    expect(responses.map((response) => response.status).sort((left, right) => left - right)).toEqual([200, 409]);
    expect(responses.find((response) => response.status === 409)?.body.code).toBe('REGISTRATION_ALREADY_CANCELLED');
  }, 20_000);

  it('checks real account activity and ownership', async () => {
    const event = await fixture.createEvent();
    const created = (await create(event.id).expect(201)).body.data;
    expect((await cancel(created.id, 1).expect(403)).body.code).toBe('REGISTRATION_NOT_OWNED');
    await fixture.client.user.update({ where: { id: fixture.users[1].id }, data: { isActive: false } });
    expect((await create(event.id, 1).expect(403)).body.code).toBe('USER_INACTIVE');
    await fixture.client.user.update({ where: { id: fixture.users[1].id }, data: { isActive: true } });
  });
});
