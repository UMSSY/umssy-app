import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { DomainExceptionFilter } from '../../../common/filters/domain-exception.filter.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor.js';
import { SessionService } from '../../../common/services/session.service.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { ManagedWorkshopsController } from '../controllers/managed-workshops.controller.js';
import { EventsRepository } from '../repositories/events.repository.js';
import { EventsService } from '../services/events.service.js';

const OWNER: AuthenticatedUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'owner@example.test',
  roles: ['titulado'],
};

const workshop = {
  id: '22222222-2222-4222-8222-222222222222',
  title: 'Taller gestionado',
  eventDate: new Date('2026-06-24T00:00:00.000Z'),
  startTime: new Date('1970-01-01T14:00:00.000Z'),
  endTime: new Date('1970-01-01T17:00:00.000Z'),
  location: 'Aula D-101',
  coverMimeType: 'image/png',
};

async function createApp(actor: AuthenticatedUser | null) {
  const findManaged = vi
    .fn()
    .mockResolvedValue([{ id: workshop.id, title: workshop.title }]);
  const getAuthenticatedUser = vi.fn().mockImplementation(async () => actor);
  const moduleRef = await Test.createTestingModule({
    controllers: [ManagedWorkshopsController],
    providers: [
      { provide: EventsService, useValue: { findManaged } },
      JwtAuthGuard,
      RolesGuard,
      {
        provide: JwtService,
        useValue: {
          verifyAsync: vi
            .fn()
            .mockResolvedValue({ sub: OWNER.id, roleTag: 'titulado' }),
        },
      },
      { provide: SessionService, useValue: { getAuthenticatedUser } },
    ],
  }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new DomainExceptionFilter());
  await app.init();
  return { app, findManaged, getAuthenticatedUser };
}

describe('managed workshops', () => {
  it('uses the supplied transaction for attendance ownership lookup', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const repository = new EventsRepository({ event: { findFirst: vi.fn() } } as never);
    const service = new EventsService(repository);
    const tx = { event: { findFirst } };

    await expect(service.findManagedWorkshop(workshop.id, OWNER.id, tx as never)).resolves.toBeNull();
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: workshop.id, createdById: OWNER.id, status: { title: 'Publicado' } },
      select: {
        id: true,
        eventDate: true,
        startTime: true,
        endTime: true,
        sessions: { select: { id: true, startsAt: true, endsAt: true } },
      },
    });
  });

  it('queries only published workshops created by the authenticated owner', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const repository = new EventsRepository({ event: { findMany } } as never);

    expect(await repository.findManaged(OWNER.id)).toEqual([]);
    expect(findMany).toHaveBeenCalledWith({
      where: { createdById: OWNER.id, status: { title: 'Publicado' } },
      select: {
        id: true,
        title: true,
        eventDate: true,
        startTime: true,
        endTime: true,
        location: true,
        coverMimeType: true,
        sessions: {
          select: { id: true, startsAt: true, endsAt: true, location: true },
          orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
        },
      },
      orderBy: [{ eventDate: 'asc' }, { startTime: 'asc' }, { id: 'asc' }],
    });
  });

  it('returns the fields used by Mis talleres without internal data or a missing cover', async () => {
    const findManaged = vi.fn().mockResolvedValue([
      workshop,
      {
        ...workshop,
        id: '33333333-3333-4333-8333-333333333333',
        coverMimeType: null,
      },
    ]);
    const service = new EventsService({ findManaged } as never);

    const result = await service.findManaged(OWNER.id);

    expect(findManaged).toHaveBeenCalledWith(OWNER.id);
    expect(result).toEqual([
      {
        id: workshop.id,
        title: workshop.title,
        eventDate: '2026-06-24',
        startTime: '14:00:00.000',
        endTime: '17:00:00.000',
        location: 'Aula D-101',
        sessions: [],
        coverUrl: `/events/${workshop.id}/cover`,
      },
      {
        id: '33333333-3333-4333-8333-333333333333',
        title: workshop.title,
        eventDate: '2026-06-24',
        startTime: '14:00:00.000',
        endTime: '17:00:00.000',
        location: 'Aula D-101',
        sessions: [],
      },
    ]);
  });

  it('preserves the exact end of the check-in window for the QA workshop', async () => {
    const findManaged = vi.fn().mockResolvedValue([{
      ...workshop,
      endTime: new Date('1970-01-01T23:59:59.999Z'),
    }]);
    const service = new EventsService({ findManaged } as never);

    const [result] = await service.findManaged(OWNER.id);

    expect(result.endTime).toBe('23:59:59.999');
  });

  it('requires a Bearer session and does not query workshops anonymously', async () => {
    const { app, findManaged, getAuthenticatedUser } = await createApp(OWNER);
    try {
      const response = await request(app.getHttpServer())
        .get('/api/events/managed')
        .expect(401);
      expect(response.body.code).toBe('UNAUTHENTICATED');
      expect(getAuthenticatedUser).not.toHaveBeenCalled();
      expect(findManaged).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('rejects a mentor before querying workshops', async () => {
    const { app, findManaged } = await createApp({
      ...OWNER,
      roles: ['mentor'],
    });
    try {
      const response = await request(app.getHttpServer())
        .get('/api/events/managed')
        .set('Authorization', 'Bearer test-token')
        .expect(403);
      expect(response.body.code).toBe('FORBIDDEN_ROLE');
      expect(findManaged).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('rejects an inactive session before querying workshops', async () => {
    const { app, findManaged } = await createApp(null);
    try {
      await request(app.getHttpServer())
        .get('/api/events/managed')
        .set('Authorization', 'Bearer test-token')
        .expect(401);
      expect(findManaged).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('returns the authenticated titulado’s workshops without caching the response', async () => {
    const { app, findManaged } = await createApp(OWNER);
    try {
      const response = await request(app.getHttpServer())
        .get('/api/events/managed')
        .set('Authorization', 'Bearer test-token')
        .expect(200);
      expect(response.headers['cache-control']).toBe('private, no-store');
      expect(response.body).toEqual({
        statusCode: 200,
        ok: true,
        detail: 'Operación exitosa',
        data: [{ id: workshop.id, title: workshop.title }],
      });
      expect(findManaged).toHaveBeenCalledExactlyOnceWith(OWNER.id);
    } finally {
      await app.close();
    }
  });
});
