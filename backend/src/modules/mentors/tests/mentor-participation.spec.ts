
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MentorParticipationController } from '../controllers/mentor-participation.controller.js';
import { MentorParticipationRepository } from '../repositories/mentor-participation.repository.js';
import { MentorParticipationService } from '../services/mentor-participation.service.js';

afterEach(() => {
  vi.restoreAllMocks();
});

const preferences = {
  technicalAreaIds: ['11111111-1111-4111-8111-111111111111'],
  orientationTypeIds: ['22222222-2222-4222-8222-222222222222'],
};

function fixture(options: {
  available?: number;
  existingRequest?: boolean;
  eligible?: boolean;
  validPreferences?: boolean;
  pending?: boolean;
} = {}) {
  const queuedAt = new Date('2026-10-26T10:00:00Z');

  const request = {
    id: 'request-1',
    userId: 'user-1',
    status: 'PENDING',
    queuedAt,
    createdAt: queuedAt,
    ...preferences,
  };

  const findFirst = vi.fn()
    .mockResolvedValue(
      options.existingRequest || options.pending
        ? request
        : null,
    );

  const create = vi.fn().mockResolvedValue(request);
  const update = vi.fn().mockImplementation(async ({ data }) => ({
    ...request,
    ...data,
  }));

  const tx = {
    $executeRaw: vi.fn().mockResolvedValue(0),
    $queryRaw: vi.fn(async (strings: TemplateStringsArray) => {
      const sql = strings.join(' ');

      if (sql.includes('pg_advisory_xact_lock')) {
        return [];
      }

      if (sql.includes('AS eligible')) {
        return [{
          eligible: options.eligible ?? true,
          alreadyMentor: false,
        }];
      }

      if (sql.includes('AS "approvedGraduates"')) {
        return [{
          approvedGraduates: 3,
          activeMentors: options.available === 0 ? 3 : 2,
          reservedOffers: 0,
        }];
      }

      return [];
    }),
    technicalArea: {
      count: vi.fn().mockResolvedValue(
        options.validPreferences === false ? 0 : 1,
      ),
    },
    orientationType: {
      count: vi.fn().mockResolvedValue(
        options.validPreferences === false ? 0 : 1,
      ),
    },
    mentorParticipationRequest: {
      findFirst,
      create,
      update,
    },
  };

  const transaction = vi.fn(async (operation) => operation(tx));

  const prisma = {
    $transaction: transaction,
    mentorParticipationRequest: {
      findFirst,
    },
  } as unknown as PrismaService;

  const repository = new MentorParticipationRepository(prisma);
  const service = new MentorParticipationService(repository);

  return {
    repository,
    service,
    tx,
    request,
    findFirst,
    create,
    update,
    transaction,
  };
}

describe('HU7-2: solicitudes de participacion FIFO', () => {
  it('registra una solicitud pendiente cuando no hay cupos', async () => {
    const { service, create } = fixture({ available: 0 });

    const result = await service.create('user-1', preferences);

    expect(result).toMatchObject({
      id: 'request-1',
      status: 'PENDING',
    });

    expect(create).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        status: 'PENDING',
        ...preferences,
      },
    });
  });

  it('no crea otra solicitud cuando ya existe una pendiente', async () => {
    const { service, create, request } = fixture({
      existingRequest: true,
    });

    const result = await service.create('user-1', preferences);

    expect(result.id).toBe(request.id);
    expect(result.queuedAt).toEqual(request.queuedAt);
    expect(create).not.toHaveBeenCalled();
  });

  it('consulta la solicitud del usuario autenticado', async () => {
    const { service, findFirst } = fixture({
      pending: true,
    });

    await service.findMyRequest('user-1');

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        status: { in: ['PENDING', 'OFFERED', 'ACTIVE'] },
      },
      orderBy: [{ queuedAt: 'desc' }, { id: 'desc' }],
    });
  });

  it('modifica preferencias sin alterar la posicion FIFO', async () => {
    const { service, update, request } = fixture({
      pending: true,
    });

    const result = await service.updatePreferences(
      'user-1',
      preferences,
    );

    expect(result.id).toBe(request.id);
    expect(result.queuedAt).toEqual(request.queuedAt);

    expect(update).toHaveBeenCalledWith({
      where: { id: request.id },
      data: preferences,
    });
  });

  it('cancela una solicitud sin eliminar el historial', async () => {
    const { service, update, request } = fixture({
      pending: true,
    });

    const result = await service.cancel('user-1');

    expect(result.status).toBe('CANCELLED');

    expect(update).toHaveBeenCalledWith({
      where: { id: request.id },
      data: { status: 'CANCELLED' },
    });
  });

  it('rechaza preferencias inexistentes', async () => {
    const { service, create } = fixture({
      available: 0,
      validPreferences: false,
    });

    await expect(
      service.create('user-1', preferences),
    ).rejects.toMatchObject({
      statusCode: 400,
    });

    expect(create).not.toHaveBeenCalled();
  });

  it('rechaza usuarios no elegibles', async () => {
    const { service, create } = fixture({
      eligible: false,
    });

    await expect(
      service.create('user-1', preferences),
    ).rejects.toMatchObject({
      statusCode: 403,
    });

    expect(create).not.toHaveBeenCalled();
  });

  it('impide modificar solicitudes que no estan pendientes', async () => {
    const { service, update } = fixture();

    await expect(
      service.updatePreferences('user-1', preferences),
    ).rejects.toMatchObject({
      statusCode: 404,
    });

    expect(update).not.toHaveBeenCalled();
  });

  it('protege el controlador y utiliza el usuario del JWT', async () => {
    const create = vi.fn().mockResolvedValue({
      status: 'PENDING',
    });

    const controller = new MentorParticipationController({
      create,
    } as unknown as MentorParticipationService);

    expect(
      Reflect.getMetadata(
        GUARDS_METADATA,
        MentorParticipationController,
      ),
    ).toEqual([JwtAuthGuard]);

    await controller.create(
      { id: 'jwt-user' } as never,
      preferences,
    );

    expect(create).toHaveBeenCalledWith(
      'jwt-user',
      preferences,
    );
  });
});
