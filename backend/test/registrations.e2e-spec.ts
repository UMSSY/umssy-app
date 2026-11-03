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

  it.each([
    ['2026-12-01', '12:00', '2026-12-01T15:59:59.999Z', '2026-12-01T16:00:00.000Z'],
    ['2026-12-01', '23:30', '2026-12-02T03:29:59.999Z', '2026-12-02T03:30:00.000Z'],
  ])('hides a finished pass without deleting its registration or token: %s %s', async (date, end, before, finished) => {
    const event = await fixture.createEvent(30);
    const registration = (await create(event.id).expect(201)).body.data;
    await fixture.client.event.update({ where: { id: event.id }, data: {
      eventDate: new Date(`${date}T00:00:00Z`), endTime: new Date(`1970-01-01T${end}:00Z`),
    } });
    const list = () => request(app.getHttpServer()).get('/api/event-registrations/me')
      .set('Authorization', `Bearer ${tokens[0]}`).expect(200);
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(before) });
    try {
      expect((await list()).body.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: registration.id })]));
      vi.setSystemTime(new Date(finished));
      expect((await list()).body.data.some((pass: { id: string }) => pass.id === registration.id)).toBe(false);
      expect((await list()).body.data.some((pass: { id: string }) => pass.id === registration.id)).toBe(false);
      const stored = await fixture.client.eventRegistration.findUniqueOrThrow({ where: { id: registration.id }, include: { status: true } });
      expect(stored.qrToken).toBe(registration.qrToken);
      expect(stored.status.title).toBe('Confirmada');
      expect(stored.cancelledAt).toBeNull();
    } finally { vi.useRealTimers(); }
  });

  it('rejects identical and partial overlaps but allows adjacent intervals and different dates', async () => {
    const first = await fixture.createEvent(30);
    expect((await create(first.id)).status).toBe(201);
    expect((await create(first.id, 1)).status).toBe(201);
    for (const [start, end, expected] of [['09:00', '12:00', 409], ['11:00', '13:00', 409], ['08:00', '10:00', 409], ['12:00', '13:00', 201]]) {
      const next = await fixture.createEvent(30);
      await fixture.client.event.update({ where: { id: next.id }, data: {
        eventDate: first.eventDate, startTime: new Date(`1970-01-01T${start}:00Z`), endTime: new Date(`1970-01-01T${end}:00Z`),
      } });
      const response = await create(next.id);
      expect(response.status).toBe(expected);
      if (expected === 409) expect(response.body.code).toBe('REGISTRATION_SCHEDULE_CONFLICT');
    }
    const otherDate = await fixture.createEvent(30);
    expect((await create(otherDate.id)).status).toBe(201);
    const registration = await fixture.client.eventRegistration.findUniqueOrThrow({ where: { eventId_userId: { eventId: first.id, userId: fixture.users[0].id } } });
    expect((await cancel(registration.id)).status).toBe(200);
    expect((await create(first.id)).status).toBe(201);
  });

  it('confirms only one concurrent overlapping workshop for the same user', async () => {
    const first = await fixture.createEvent(30);
    const second = await fixture.createEvent(30);
    await fixture.client.event.update({ where: { id: second.id }, data: { eventDate: first.eventDate } });
    const release = synchronizeEventLocks();
    try {
      const responses = await Promise.all([create(first.id, 2), create(second.id, 2)]);
      expect(responses.map(response => response.status).sort((left, right) => left - right)).toEqual([201, 409]);
      expect(await fixture.client.eventRegistration.count({ where: { userId: fixture.users[2].id, eventId: { in: [first.id, second.id] } } })).toBe(1);
    } finally { release(); }
  });

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
