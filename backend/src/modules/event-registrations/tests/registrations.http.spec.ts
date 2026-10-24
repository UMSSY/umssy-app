import { Logger, type INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { EventRegistrationsService } from '../services/event-registrations.service.js';
import { AlreadySupportedException } from '../exceptions/already-supported.exception.js';
import { ProposalExpiredException } from '../exceptions/proposal-expired.exception.js';
import { EventNotSupportableException } from '../exceptions/event-not-supportable.exception.js';
import { EventsService } from '../../events/index.js';
import { EventNotFoundException } from '../../events/exceptions/event-not-found.exception.js';
import { EventRegistrationsModule } from '../event-registrations.module.js';
import { EVENT_ID, NOW, REGISTRATION_ID, USER_ID, registrationFixture, registrationRecord } from '../../../../test/fixtures/registration.fixture.js';

let app: INestApplication;
let fixture: ReturnType<typeof registrationFixture>;
let findFirst: ReturnType<typeof vi.fn>;
let token: string;

beforeEach(async () => {
  vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
  fixture = registrationFixture();
  findFirst = vi.fn().mockResolvedValue({ id: USER_ID, email: 'user@example.test', isActive: true, roles: [{ role: { name: 'titulado' } }] });
  const jwt = new JwtService({ secret: 'registration-http-test-secret' });
  token = jwt.sign({ sub: USER_ID, roleTag: 'titulado' });
  const moduleRef = await Test.createTestingModule({
    imports: [EventRegistrationsModule],
    providers: [
      { provide: APP_FILTER, useClass: DomainExceptionFilter },
      { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    ],
  })
    .overrideProvider(PrismaService).useValue({ ...fixture.prisma, user: { findFirst } })
    .overrideProvider(EventsService).useValue(fixture.events)
    .overrideProvider(JwtService).useValue(jwt)
    .compile();
  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  await app.init();
});

afterEach(async () => {
  await app?.close();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const ERROR_CASES = [
  ['VALIDATION_ERROR', 400, 'Los parámetros de la solicitud no son válidos.'],
  ['UNAUTHENTICATED', 401, 'Se requiere una sesión válida.'],
  ['USER_INACTIVE', 403, 'La cuenta del usuario está inactiva.'],
  ['REGISTRATION_NOT_OWNED', 403, 'La inscripción no pertenece al usuario autenticado.'],
  ['EVENT_NOT_FOUND', 404, 'El evento no existe.'],
  ['REGISTRATION_NOT_FOUND', 404, 'La inscripción no existe.'],
  ['ALREADY_REGISTERED', 409, 'El usuario ya tiene una inscripción confirmada para este evento.'],
  ['EVENT_FULL', 409, 'El evento no tiene cupos disponibles.'],
  ['REGISTRATION_ALREADY_CANCELLED', 409, 'La inscripción ya está cancelada.'],
  ['EVENT_NOT_OPEN', 422, 'El estado del evento no permite inscripciones.'],
  ['REGISTRATION_CLOSED', 422, 'El plazo para inscribirse o cancelar la inscripción ha terminado.'],
  ['INTERNAL_ERROR', 500, 'Ocurrió un error interno al procesar la solicitud.'],
] as const;

describe('registration HTTP contract', () => {
  it('keeps the support route and uses the authenticated identity', async () => {
    const support = vi.spyOn(app.get(EventRegistrationsService), 'support').mockResolvedValue({ eventId: EVENT_ID, supportCount: 1, supportThreshold: 8, supportsRemaining: 7, progressPercent: 12.5, hasSupported: true });
    await request(app.getHttpServer()).post(`/api/event-registrations/support/${EVENT_ID}?userId=forged`)
      .set('Authorization', `Bearer ${token}`).expect(201);
    expect(support).toHaveBeenCalledWith(EVENT_ID, USER_ID);
  });
  it('protects support with authentication, role and parameter validation', async () => {
    const support = vi.spyOn(app.get(EventRegistrationsService), 'support');
    await request(app.getHttpServer()).post(`/api/event-registrations/support/${EVENT_ID}`).expect(401);
    await request(app.getHttpServer()).post('/api/event-registrations/support/invalid').set('Authorization', `Bearer ${token}`).expect(400);
    findFirst.mockResolvedValue({ id: USER_ID, email: 'user@example.test', isActive: true, roles: [{ role: { name: 'empresa' } }] });
    await request(app.getHttpServer()).post(`/api/event-registrations/support/${EVENT_ID}`).set('Authorization', `Bearer ${token}`).expect(403);
    expect(support).not.toHaveBeenCalled();
  });
  it.each([
    [AlreadySupportedException, 'ALREADY_SUPPORTED'],
    [ProposalExpiredException, 'PROPOSAL_EXPIRED'],
    [EventNotSupportableException, 'EVENT_NOT_SUPPORTABLE'],
  ] as const)('returns the support error contract for %s', async (Exception, code) => {
    vi.spyOn(app.get(EventRegistrationsService), 'support').mockRejectedValue(new Exception());
    const response = await request(app.getHttpServer()).post(`/api/event-registrations/support/${EVENT_ID}`).set('Authorization', `Bearer ${token}`).expect(409);
    expect(response.body).toMatchObject({ statusCode: 409, ok: false, code, data: null });
  });

  it.each(ERROR_CASES)('returns the complete contract for %s', async (code, statusCode, detail) => {
    let method: 'post' | 'get' | 'delete' = 'post';
    let url = `/api/events/${EVENT_ID}/registrations`;
    switch (code) {
      case 'VALIDATION_ERROR': url = '/api/events/invalid/registrations'; break;
      case 'USER_INACTIVE': findFirst.mockResolvedValue({ id: USER_ID, isActive: false, roles: [] }); break;
      case 'REGISTRATION_NOT_OWNED':
        method = 'delete'; url = `/api/registrations/${REGISTRATION_ID}`;
        fixture.tx.eventRegistration.findUnique.mockResolvedValue(registrationRecord({ userId: 'another-user' })); break;
      case 'EVENT_NOT_FOUND': fixture.events.findForRegistration.mockRejectedValue(new EventNotFoundException()); break;
      case 'REGISTRATION_NOT_FOUND': method = 'get'; url += '/me'; break;
      case 'ALREADY_REGISTERED': fixture.tx.eventRegistration.findUnique.mockResolvedValue(registrationRecord()); break;
      case 'EVENT_FULL': fixture.tx.eventRegistration.count.mockResolvedValue(1); break;
      case 'REGISTRATION_ALREADY_CANCELLED':
        method = 'delete'; url = `/api/registrations/${REGISTRATION_ID}`;
        fixture.tx.eventRegistration.findUnique.mockResolvedValue(registrationRecord({ status: { title: 'Cancelada' }, cancelledAt: NOW })); break;
      case 'EVENT_NOT_OPEN': fixture.event.status.title = 'Borrador'; break;
      case 'REGISTRATION_CLOSED': fixture.event.eventDate = new Date('2026-10-22'); break;
      case 'INTERNAL_ERROR':
        vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
        fixture.prisma.$transaction.mockRejectedValue(new Error('Private database details')); break;
      case 'UNAUTHENTICATED': break;
    }
    const call = request(app.getHttpServer())[method](url);
    if (code !== 'UNAUTHENTICATED') call.set('Authorization', `Bearer ${token}`);
    const response = await call.expect(statusCode);
    expect(response.body).toEqual({ statusCode, ok: false, code, detail, data: null });
  });

  it('wraps POST 201 without requiring a body and ignores a forged query identity', async () => {
    const response = await request(app.getHttpServer()).post(`/api/events/${EVENT_ID}/registrations?userId=other`)
      .set('Authorization', `Bearer ${token}`).expect(201);
    expect(response.body).toMatchObject({ statusCode: 201, ok: true, detail: 'Operación exitosa', data: { id: REGISTRATION_ID, eventId: EVENT_ID, status: 'confirmed', cancelledAt: null } });
    expect(fixture.tx.eventRegistration.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ user: { connect: { id: USER_ID } } }) }));
  });

  it.each([{ userId: USER_ID }, { status: 'confirmed' }, { qrToken: 'forged' }])('rejects unsolicited body fields', async (body) => {
    const response = await request(app.getHttpServer()).post(`/api/events/${EVENT_ID}/registrations`)
      .set('Authorization', `Bearer ${token}`).send(body).expect(400);
    expect(response.body).toMatchObject({ code: 'VALIDATION_ERROR', data: null });
    expect(fixture.prisma.$transaction).not.toHaveBeenCalled();
  });

  it('returns a cancelled registration with 200', async () => {
    fixture.tx.eventRegistration.findUnique.mockResolvedValue(registrationRecord({ status: { title: 'Cancelada' }, cancelledAt: NOW }));
    const response = await request(app.getHttpServer()).get(`/api/events/${EVENT_ID}/registrations/me`)
      .set('Authorization', `Bearer ${token}`).expect(200);
    expect(response.body.data).toMatchObject({ status: 'cancelled', cancelledAt: NOW.toISOString() });
  });

  it('returns the cancelled DTO from DELETE with 200', async () => {
    fixture.tx.eventRegistration.findUnique.mockResolvedValue(registrationRecord());
    const response = await request(app.getHttpServer()).delete(`/api/registrations/${REGISTRATION_ID}`)
      .set('Authorization', `Bearer ${token}`).expect(200);
    expect(response.body).toMatchObject({ statusCode: 200, ok: true, data: { status: 'cancelled' } });
  });

  it.each(['expired', 'invalid'])('normalizes an %s token as UNAUTHENTICATED', async (kind) => {
    const authorization = kind === 'expired'
      ? new JwtService({ secret: 'registration-http-test-secret' }).sign({ sub: USER_ID, roleTag: 'titulado' }, { expiresIn: -1 })
      : 'invalid';
    const response = await request(app.getHttpServer()).get(`/api/events/${EVENT_ID}/registrations/me`)
      .set('Authorization', `Bearer ${authorization}`).expect(401);
    expect(response.body).toEqual({ statusCode: 401, ok: false, code: 'UNAUTHENTICATED', detail: 'Se requiere una sesión válida.', data: null });
  });

  it('documents all routes, security, response fields and error codes', () => {
    const document = SwaggerModule.createDocument(app, new DocumentBuilder().addBearerAuth().build());
    const operation = document.paths['/api/events/{eventId}/registrations'].post!;
    expect(operation.security).toEqual([{ bearer: [] }]);
    expect(operation.responses['201']).toBeDefined();
    expect(JSON.stringify(operation.responses)).toContain('qrToken');
    for (const [code] of ERROR_CASES) expect(JSON.stringify(operation.responses)).toContain(code);
    expect(document.paths['/api/events/{eventId}/registrations/me'].get).toBeDefined();
    expect(document.paths['/api/registrations/{registrationId}'].delete).toBeDefined();
  });
});
