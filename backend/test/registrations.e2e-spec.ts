import type { INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { DomainExceptionFilter } from '../src/common/filters/domain-exception.filter.js';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor.js';
import { PrismaService } from '../src/common/prisma/prisma.service.js';
import { EventRegistrationsService } from '../src/modules/event-registrations/services/event-registrations.service.js';
import { EventRegistrationsModule } from '../src/modules/event-registrations/index.js';
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
  const support = (eventId: string, user = 0) => request(app.getHttpServer())
    .post(`/api/event-registrations/support/${eventId}`).set('Authorization', `Bearer ${tokens[user]}`).timeout(REQUEST_TIMEOUT);

  function synchronizeEventLocks() {
    const service = app.get(EventRegistrationsService) as unknown as {
      lockEventRow: (tx: unknown, eventId: string) => Promise<void>;
    };
    const lock = service.lockEventRow.bind(service);
    let arrived = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const timer = setTimeout(release, 5_000);
    vi.spyOn(service, 'lockEventRow').mockImplementation(async (tx, eventId) => {
      if (arrived < 2) {
        arrived += 1;
        if (arrived === 2) { clearTimeout(timer); release(); }
        await gate;
      }
      await lock(tx, eventId);
    });
    return () => { clearTimeout(timer); release(); expect(arrived).toBe(2); };
  }

  function synchronizeSupportReads() {
    const service = app.get(EventRegistrationsService) as unknown as {
      loadSupportContext: (tx: unknown, eventId: string) => Promise<unknown>;
    };
    const read = service.loadSupportContext.bind(service);
    let arrived = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const timer = setTimeout(release, 5_000);
    vi.spyOn(service, 'loadSupportContext').mockImplementation(async (tx, eventId) => {
      const context = await read(tx, eventId);
      if (arrived < 2) {
        arrived += 1;
        if (arrived === 2) { clearTimeout(timer); release(); }
        await gate;
      }
      return context;
    });
    return () => { clearTimeout(timer); release(); expect(arrived).toBe(2); };
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
    const verifyOverlap = synchronizeEventLocks();
    const responses = await Promise.all([create(event.id, 0), create(event.id, 1)]);
    verifyOverlap();
    expect(responses.map((response) => response.status).sort((left, right) => left - right)).toEqual([201, 409]);
    expect(responses.find((response) => response.status === 409)?.body.code).toBe('EVENT_FULL');
    expect(await fixture.client.eventRegistration.count({ where: { eventId: event.id, cancelledAt: null } })).toBe(1);
  }, 20_000);

  it('normalizes concurrent duplicate requests without creating a second row', async () => {
    const event = await fixture.createEvent(null);
    const verifyOverlap = synchronizeEventLocks();
    const responses = await Promise.all([create(event.id), create(event.id)]);
    verifyOverlap();
    expect(responses.map((response) => response.status).sort((left, right) => left - right)).toEqual([201, 201]);
    expect(responses[0]!.body.data).toEqual(responses[1]!.body.data);
    expect(responses[0]!.body.data.qrToken).toMatch(/^[a-f0-9]{64}$/);
    expect(await fixture.client.eventRegistration.count({ where: { eventId: event.id } })).toBe(1);
  }, 20_000);

  it('allows only one concurrent cancellation', async () => {
    const event = await fixture.createEvent();
    const created = (await create(event.id).expect(201)).body.data;
    const verifyOverlap = synchronizeEventLocks();
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

  it('persists both simultaneous threshold supports and exposes their confirmed passes', async () => {
    const event = await fixture.createVotingProposal();
    for (const user of [0, 1]) {
      const mine = await request(app.getHttpServer()).get('/api/event-registrations/me')
        .set('Authorization', `Bearer ${tokens[user]}`).expect(200);
      expect(mine.body.data.some((item: { eventName: string }) => item.eventName === event.title)).toBe(false);
    }

    const verifyOverlap = synchronizeSupportReads();
    const responses = await Promise.all([support(event.id, 0), support(event.id, 1)]);
    verifyOverlap();

    expect(responses.map((response) => response.status)).toEqual([201, 201]);
    expect(responses.map((response) => response.body.data.status)).toEqual(['Publicado', 'Publicado']);
    expect(responses.map((response) => response.body.data.supportCount).sort((left, right) => left - right)).toEqual([8, 9]);
    expect((await fixture.client.event.findUniqueOrThrow({ where: { id: event.id }, include: { status: true } })).status.title).toBe('Publicado');
    expect(await fixture.client.eventRegistration.count({ where: { eventId: event.id, cancelledAt: null } })).toBe(9);
    for (const user of [0, 1]) {
      const mine = await request(app.getHttpServer()).get('/api/event-registrations/me')
        .set('Authorization', `Bearer ${tokens[user]}`).expect(200);
      expect(mine.body.data).toEqual(expect.arrayContaining([
        expect.objectContaining({ eventName: event.title, status: 'Confirmada' }),
      ]));
    }
    expect((await support(event.id, 0).expect(409)).body.code).toBe('ALREADY_SUPPORTED');
    expect((await support(event.id, 2).expect(409)).body.code).toBe('EVENT_NOT_SUPPORTABLE');
    expect(await fixture.client.eventRegistration.count({ where: { eventId: event.id, cancelledAt: null } })).toBe(9);
  }, 20_000);
});
