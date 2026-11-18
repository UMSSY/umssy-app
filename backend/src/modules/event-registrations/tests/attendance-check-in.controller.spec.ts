import { describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { AttendanceCheckInController } from '../controllers/attendance-check-in.controller.js';
import { AttendanceCheckInService } from '../services/attendance-check-in.service.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { SessionService } from '../../../common/services/session.service.js';
import { AttendanceOutsideWindowException } from '../exceptions/attendance-outside-window.exception.js';
import { UnauthorizedSessionException } from '../../../common/exceptions/unauthorized-session.exception.js';

const EVENT_ID = '33333333-3333-4333-8333-333333333333';
const ACTOR: AuthenticatedUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'owner@example.test',
  roles: ['titulado'],
};
const TOKEN = 'a'.repeat(64);
const TIME = '2026-11-16T14:20:00.000Z';

async function setup(result: { result: 'registered' | 'duplicate'; checkedInAt: string }) {
  const checkIn = vi.fn().mockResolvedValue(result);
  const moduleRef = await Test.createTestingModule({
    controllers: [AttendanceCheckInController],
    providers: [{ provide: AttendanceCheckInService, useValue: { checkIn } }],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: (context: { switchToHttp: () => { getRequest: () => { user?: AuthenticatedUser } } }) => {
      context.switchToHttp().getRequest().user = ACTOR;
      return true;
    } })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new DomainExceptionFilter());
  await app.init();
  return { app, checkIn };
}

async function setupWithRealGuards(actor: AuthenticatedUser | null) {
  const checkIn = vi.fn().mockResolvedValue({ result: 'registered', checkedInAt: TIME });
  const getAuthenticatedUser = vi.fn().mockImplementation(async () => {
    if (!actor) throw new UnauthorizedSessionException();
    return actor;
  });
  const moduleRef = await Test.createTestingModule({
    controllers: [AttendanceCheckInController],
    providers: [
      { provide: AttendanceCheckInService, useValue: { checkIn } },
      JwtAuthGuard,
      RolesGuard,
      { provide: JwtService, useValue: { verifyAsync: vi.fn().mockResolvedValue({ sub: ACTOR.id, roleTag: 'titulado' }) } },
      { provide: SessionService, useValue: { getAuthenticatedUser } },
    ],
  }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new DomainExceptionFilter());
  await app.init();
  return { app, checkIn, getAuthenticatedUser };
}

describe('AttendanceCheckInController', () => {
  it.each([
    { result: 'registered' as const, status: 201 },
    { result: 'duplicate' as const, status: 200 },
  ])('returns $result with HTTP $status and the matching response envelope', async ({ result, status }) => {
    const { app, checkIn } = await setup({ result, checkedInAt: TIME });
    try {
      const response = await request(app.getHttpServer())
        .post(`/api/events/${EVENT_ID}/attendances/check-ins`)
        .send({ reference: `v1:${TOKEN}` })
        .expect(status);
      expect(response.headers['cache-control']).toBe('private, no-store');
      expect(response.body).toEqual({
        statusCode: status, ok: true, detail: 'Operación exitosa',
        data: { result, checkedInAt: TIME },
      });
      expect(checkIn).toHaveBeenCalledWith(EVENT_ID, ACTOR, TOKEN);
    } finally {
      await app.close();
    }
  });

  it('returns the attendance window error without exposing a pass or writing attendance', async () => {
    const { app, checkIn } = await setup({ result: 'registered', checkedInAt: TIME });
    checkIn.mockRejectedValueOnce(new AttendanceOutsideWindowException());
    try {
      const response = await request(app.getHttpServer())
        .post(`/api/events/${EVENT_ID}/attendances/check-ins`)
        .send({ reference: TOKEN })
        .expect(409);
      expect(response.body).toMatchObject({
        statusCode: 409, ok: false, code: 'ATTENDANCE_OUTSIDE_WINDOW', data: null,
      });
      expect(JSON.stringify(response.body)).not.toContain(TOKEN);
    } finally {
      await app.close();
    }
  });

  it('requires a Bearer session before attempting a check-in', async () => {
    const { app, checkIn, getAuthenticatedUser } = await setupWithRealGuards(ACTOR);
    try {
      const response = await request(app.getHttpServer())
        .post(`/api/events/${EVENT_ID}/attendances/check-ins`)
        .send({ reference: TOKEN })
        .expect(401);
      expect(response.body.code).toBe('UNAUTHENTICATED');
      expect(getAuthenticatedUser).not.toHaveBeenCalled();
      expect(checkIn).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('rejects an expired or inactive session', async () => {
    const { app, checkIn } = await setupWithRealGuards(null);
    try {
      const response = await request(app.getHttpServer())
        .post(`/api/events/${EVENT_ID}/attendances/check-ins`)
        .set('Authorization', 'Bearer test-token')
        .send({ reference: TOKEN })
        .expect(401);
      expect(response.body.code).toBe('UNAUTHENTICATED');
      expect(checkIn).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('rejects a mentor-only account before attempting a check-in', async () => {
    const { app, checkIn } = await setupWithRealGuards({ ...ACTOR, roles: ['mentor'] });
    try {
      const response = await request(app.getHttpServer())
        .post(`/api/events/${EVENT_ID}/attendances/check-ins`)
        .set('Authorization', 'Bearer test-token')
        .send({ reference: TOKEN })
        .expect(403);
      expect(response.body.code).toBe('FORBIDDEN_ROLE');
      expect(checkIn).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('accepts the registration UUID as a manual reference', async () => {
    const registrationId = '22222222-2222-4222-8222-222222222222';
    const { app, checkIn } = await setup({ result: 'registered', checkedInAt: TIME });
    try {
      await request(app.getHttpServer())
        .post(`/api/events/${EVENT_ID}/attendances/check-ins`)
        .send({ reference: registrationId })
        .expect(201);
      expect(checkIn).toHaveBeenCalledWith(EVENT_ID, ACTOR, registrationId);
    } finally {
      await app.close();
    }
  });

  it('rejects unsupported references and additional identity fields before writing', async () => {
    const { app, checkIn } = await setup({ result: 'registered', checkedInAt: TIME });
    try {
      for (const body of [{ reference: 'SHORT-1234' }, { reference: TOKEN, userId: ACTOR.id }]) {
        const response = await request(app.getHttpServer())
          .post(`/api/events/${EVENT_ID}/attendances/check-ins`)
          .send(body)
          .expect(400);
        expect(response.body.code).toBe('VALIDATION_ERROR');
      }
      const badEvent = await request(app.getHttpServer())
        .post('/api/events/not-a-uuid/attendances/check-ins')
        .send({ reference: TOKEN })
        .expect(400);
      expect(badEvent.body.code).toBe('VALIDATION_ERROR');
      expect(checkIn).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
});
