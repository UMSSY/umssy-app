import { Controller, Get, Req, UseGuards, type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../../../common/guards/optional-jwt-auth.guard.js';
import { SessionRepository } from '../../../common/repositories/session.repository.js';
import { SessionService } from '../../../common/services/session.service.js';
import type { AuthenticatedRequest } from '../../../common/types/authenticated-request.types.js';
import { SessionRevokedException } from '../exceptions/index.js';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository.js';
import { RefreshTokenService } from '../services/refresh-token.service.js';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const jwt = new JwtService({ secret: 'session-revocation-flow-secret' });

interface Row {
  id: string;
  userId: string;
  familyId: string;
  roleTag: string;
  tokenHash: string;
  expiresAt: Date;
  absoluteExpiresAt: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
  revokedReason: string | null;
  userAgent: string | null;
}

function createFakePrisma() {
  const rows: Row[] = [];
  const state = { userActive: true };
  const matches = (row: Row, where: Record<string, unknown>) =>
    Object.entries(where).every(([key, expected]) => {
      const actual = row[key as keyof Row];
      if (expected === null) return actual === null;
      if (typeof expected === 'object' && expected !== null && 'not' in expected) {
        return actual !== (expected as { not: unknown }).not;
      }
      return actual === expected;
    });
  const refreshToken = {
    create: ({ data }: { data: Partial<Row> }) => {
      const row = { id: randomUUID(), usedAt: null, revokedAt: null, revokedReason: null, ...data } as Row;
      rows.push(row);
      return Promise.resolve(row);
    },
    findUnique: ({ where }: { where: { tokenHash: string } }) =>
      Promise.resolve(rows.find((row) => row.tokenHash === where.tokenHash) ?? null),
    findFirst: ({ where }: { where: Record<string, unknown> }) =>
      Promise.resolve(rows.find((row) => matches(row, where)) ?? null),
    updateMany: ({ where, data }: { where: Record<string, unknown>; data: Partial<Row> }) => {
      const hit = rows.filter((row) => matches(row, where));
      for (const row of hit) Object.assign(row, data);
      return Promise.resolve({ count: hit.length });
    },
  };
  const prisma = {
    refreshToken,
    $transaction: (callback: (tx: unknown) => unknown) => Promise.resolve(callback({ refreshToken })),
    user: {
      findFirst: () =>
        Promise.resolve({
          id: USER_ID,
          email: 'user@umss.test',
          isActive: state.userActive,
          company: null,
          roles: [{ role: { name: 'titulado' } }],
        }),
    },
  };
  return { prisma, rows, state };
}

@Controller()
class ProbeController {
  @Get('private')
  @UseGuards(JwtAuthGuard)
  privateRoute() {
    return { ok: true };
  }

  @Get('public')
  publicRoute() {
    return { ok: true };
  }

  @Get('optional')
  @UseGuards(OptionalJwtAuthGuard)
  optionalRoute(@Req() req: AuthenticatedRequest) {
    return { authenticated: Boolean(req.user) };
  }
}

describe('revocación de sesión por petición', () => {
  let app: INestApplication;
  let fake: ReturnType<typeof createFakePrisma>;
  let refresh: RefreshTokenService;
  const holder: { service?: SessionService } = {};
  const sessionDelegate = {
    assertSessionActive: (sessionId: unknown) => holder.service!.assertSessionActive(sessionId),
    getAuthenticatedUser: (userId: string) => holder.service!.getAuthenticatedUser(userId),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
      providers: [
        { provide: JwtService, useValue: jwt },
        { provide: SessionService, useValue: sessionDelegate },
        JwtAuthGuard,
        OptionalJwtAuthGuard,
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  beforeEach(() => {
    fake = createFakePrisma();
    const sessionService = new SessionService(new SessionRepository(fake.prisma as never));
    holder.service = sessionService;
    refresh = new RefreshTokenService(
      new RefreshTokenRepository(fake.prisma as never),
      jwt,
      sessionService,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  async function startSession() {
    const legacy = jwt.sign({ sub: USER_ID, roleTag: 'titulado', roles: ['titulado'] }, { expiresIn: '8h' });
    const session = await refresh.startFromLogin(legacy, 'Mozilla/5.0');
    return { ...session, sid: jwt.decode<{ sid: string }>(session.accessToken).sid };
  }

  const getPrivate = (token: string) =>
    request(app.getHttpServer()).get('/private').set('Authorization', `Bearer ${token}`);

  it('el access token emitido al iniciar sesión lleva la familia de refresh como sid y conserva el vencimiento', async () => {
    const session = await startSession();
    const claims = jwt.decode<{ sid: string; sub: string; roleTag: string; roles: string[]; exp: number }>(
      session.accessToken,
    );

    expect(claims.sid).toBe(fake.rows[0].familyId);
    expect(claims).toMatchObject({ sub: USER_ID, roleTag: 'titulado', roles: ['titulado'] });
    expect(session.accessMaxAgeMs).toBeGreaterThan(7.9 * 3_600_000);
    expect((await getPrivate(session.accessToken)).status).toBe(200);
  });

  it('cambiar la contraseña revoca: el access token anterior recibe 401 PASSWORD_CHANGED en la siguiente petición', async () => {
    const other = await startSession();
    const current = await startSession();
    expect((await getPrivate(other.accessToken)).status).toBe(200);

    await refresh.revokeAllForUser(USER_ID);

    for (const session of [other, current]) {
      const response = await getPrivate(session.accessToken);
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ code: 'PASSWORD_CHANGED', ok: false });
    }
  });

  it('el cierre de sesión revoca solo esa sesión; otra del mismo usuario sigue válida', async () => {
    const first = await startSession();
    const second = await startSession();

    await refresh.revokeByToken(first.refreshToken);

    const closed = await getPrivate(first.accessToken);
    expect(closed.status).toBe(401);
    expect(closed.body).toMatchObject({
      code: 'SESSION_REVOKED',
      detail: 'Tu sesión se cerró. Inicia sesión nuevamente.',
    });
    expect((await getPrivate(second.accessToken)).status).toBe(200);
  });

  it('el access token renovado conserva el sid y reutilizar un refresh ya usado revoca toda la familia', async () => {
    const session = await startSession();
    const rotated = await refresh.rotate(session.refreshToken, 'Mozilla/5.0');
    expect(jwt.decode<{ sid: string }>(rotated.accessToken).sid).toBe(session.sid);
    expect((await getPrivate(rotated.accessToken)).status).toBe(200);

    await expect(refresh.rotate(session.refreshToken, 'Mozilla/5.0')).rejects.toBeInstanceOf(
      SessionRevokedException,
    );

    for (const token of [session.accessToken, rotated.accessToken]) {
      const response = await getPrivate(token);
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ code: 'SESSION_REVOKED' });
    }
  });

  it('funciona igual cuando el token llega solo por la cookie HttpOnly', async () => {
    const session = await startSession();
    await refresh.revokeByToken(session.refreshToken);

    const response = await request(app.getHttpServer())
      .get('/private')
      .set('Cookie', `umssy_access=${session.accessToken}`);

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ code: 'SESSION_REVOKED' });
  });

  it('un usuario desactivado con sesión nueva recibe 401 SESSION_REVOKED', async () => {
    const session = await startSession();
    fake.state.userActive = false;

    const response = await getPrivate(session.accessToken);

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ code: 'SESSION_REVOKED' });
  });

  it('un token emitido antes del cambio (sin sid) se acepta hasta que expire, aunque haya sesiones revocadas', async () => {
    await startSession();
    await refresh.revokeAllForUser(USER_ID);
    const legacy = jwt.sign({ sub: USER_ID, roleTag: 'titulado', roles: ['titulado'] }, { expiresIn: '1h' });

    expect((await getPrivate(legacy)).status).toBe(200);
  });

  it('las rutas públicas no se ven afectadas y las opcionales tratan un token revocado como anónimo', async () => {
    const session = await startSession();
    await refresh.revokeByToken(session.refreshToken);

    expect((await request(app.getHttpServer()).get('/public')).status).toBe(200);
    const optional = await request(app.getHttpServer())
      .get('/optional')
      .set('Authorization', `Bearer ${session.accessToken}`);
    expect(optional.status).toBe(200);
    expect(optional.body).toEqual({ authenticated: false });
  });
});
