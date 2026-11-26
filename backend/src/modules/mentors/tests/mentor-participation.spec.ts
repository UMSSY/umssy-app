import { afterEach, describe, expect, it, vi } from 'vitest';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MentorParticipationController } from '../controllers/mentor-participation.controller.js';
import { MentorParticipationRepository } from '../repositories/mentor-participation.repository.js';
import { MentorParticipationService } from '../services/mentor-participation.service.js';
import { randomUUID } from 'node:crypto';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const preferences = {
  technicalAreaIds: ['11111111-1111-4111-8111-111111111111'],
  orientationTypeIds: ['22222222-2222-4222-8222-222222222222'],
};

type AttemptLimit = {
  userId: string;
  attemptCount: number;
  windowStartedAt: Date | null;
  blockedUntil: Date | null;
};

function fixture(
  options: {
    available?: number;
    existingRequest?: boolean;
    eligible?: boolean;
    validPreferences?: boolean;
    pending?: boolean;
  } = {},
) {
  const queuedAt = new Date('2026-10-26T10:00:00Z');

  const request = {
    id: 'request-1',
    userId: 'user-1',
    status: 'PENDING',
    queuedAt,
    createdAt: queuedAt,
    ...preferences,
    user: { email: 'titulado@umssy.test' },
    offer: null,
  };

  const policyAttempts: Array<{
    id: string;
    userId: string;
    operation: string;
    key: string;
    payloadHash: string;
    occurredAt: Date;
    counted: boolean;
    outcome: unknown;
  }> = [];
  const policySanctions: Array<{
    id: string;
    userId: string;
    startedAt: Date;
    endsAt: Date;
  }> = [];

  const findFirst = vi
    .fn()
    .mockResolvedValue(
      options.existingRequest || options.pending ? request : null,
    );

  const create = vi.fn().mockResolvedValue(request);

  const update = vi.fn().mockImplementation(async ({ data }) => ({
    ...request,
    ...data,
  }));

  const tx = {
    mentorIntakeAttempt: {
      findUnique: vi.fn(
        async ({
          where,
        }: {
          where: {
            userId_operation_idempotencyKey: {
              userId: string;
              operation: string;
              idempotencyKey: string;
            };
          };
        }) => {
          const key = where.userId_operation_idempotencyKey;
          const row = policyAttempts.find(
            (item) =>
              item.userId === key.userId &&
              item.operation === key.operation &&
              item.key === key.idempotencyKey,
          );
          return row
            ? { payloadHash: row.payloadHash, responseData: row.outcome }
            : null;
        },
      ),
      count: vi.fn(
        async ({
          where,
        }: {
          where: { userId: string; occurredAt: { gt: Date; lte: Date } };
        }) =>
          policyAttempts.filter(
            (row) =>
              row.userId === where.userId &&
              row.counted &&
              row.occurredAt > where.occurredAt.gt &&
              row.occurredAt <= where.occurredAt.lte,
          ).length,
      ),
      createMany: vi.fn(
        async ({
          data,
        }: {
          data: {
            id: string;
            userId: string;
            operation: string;
            idempotencyKey: string;
            payloadHash: string;
            occurredAt: Date;
            counted: boolean;
            responseData: unknown;
          }[];
        }) => {
          for (const row of data)
            policyAttempts.push({
              ...row,
              key: row.idempotencyKey,
              outcome: row.responseData,
            });
          return { count: data.length };
        },
      ),
    },
    mentorParticipationSanction: {
      findFirst: vi.fn(
        async ({
          where,
        }: {
          where: { userId: string; endsAt: { gt: Date } };
        }) =>
          policySanctions
            .filter(
              (row) =>
                row.userId === where.userId && row.endsAt > where.endsAt.gt,
            )
            .sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime())[0] ?? null,
      ),
      create: vi.fn(
        async ({
          data,
        }: {
          data: { userId: string; startedAt: Date; endsAt: Date };
        }) => {
          const row = { id: randomUUID(), ...data };
          policySanctions.push(row);
          return { id: row.id };
        },
      ),
    },
    $executeRaw: vi.fn().mockResolvedValue(0),
    $queryRaw: vi.fn(
      async (strings: TemplateStringsArray, ...values: unknown[]) => {
        const sql = strings.join(' ');

        if (sql.trim() === 'SELECT clock_timestamp() AS now')
          return [{ now: new Date() }];
        if (sql.includes('pg_advisory_xact_lock')) {
          return [];
        }

        if (sql.includes('AS eligible')) {
          return [
            {
              eligible: options.eligible ?? true,
              alreadyMentor: false,
            },
          ];
        }

        if (sql.includes('AS "approvedGraduates"')) {
          return [
            {
              approvedGraduates: 3,
              activeMentors: options.available === 0 ? 3 : 2,
              reservedOffers: 0,
            },
          ];
        }

        if (sql.includes(' AS exists')) return [{ exists: false }];
        if (sql.includes('INSERT INTO mentor_participation_requests')) {
          return [
            await create({
              data: { userId: 'user-1', status: 'PENDING', ...preferences },
            }),
          ];
        }
        if (sql.includes('FROM mentor_participation_requests')) {
          const found = await findFirst();
          return found ? [found] : [];
        }
        return [];
      },
    ),
    technicalArea: {
      count: vi
        .fn()
        .mockResolvedValue(options.validPreferences === false ? 0 : 1),
    },
    orientationType: {
      count: vi
        .fn()
        .mockResolvedValue(options.validPreferences === false ? 0 : 1),
    },
    mentorParticipationRequest: {
      findFirst,
      create,
      update,
      updateManyAndReturn: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { userId: string; status: string };
          data: { status: string };
        }) =>
          options.pending &&
          where.userId === request.userId &&
          where.status === request.status
            ? [{ ...request, ...data }]
            : [],
      ),
    },
  };

  const transaction = vi.fn(async (operation) => operation(tx));

  const prisma = {
    $transaction: transaction,
    mentorParticipationRequest: {
      findFirst,
      findMany: vi.fn().mockResolvedValue([]),
    },
  } as unknown as PrismaService;

  const repository = new MentorParticipationRepository(prisma);
  const service = new MentorParticipationService(repository);
  const createWithPolicy = service.create.bind(service);
  vi.spyOn(service, 'create').mockImplementation((id, form, key, transaction) =>
    createWithPolicy(
      id,
      form,
      transaction ? undefined : (key ?? randomUUID()),
      transaction,
    ),
  );

  return {
    repository,
    service,
    tx,
    request,
    findFirst,
    create,
    update,
    transaction,
    getAttemptLimit: (): AttemptLimit | null => {
      const recent = policyAttempts.filter(
        (row) =>
          row.counted && row.occurredAt.getTime() > Date.now() - 86400000,
      );
      const active = policySanctions.find(
        (row) => row.endsAt.getTime() > Date.now(),
      );
      return recent.length || active
        ? {
            userId: 'user-1',
            attemptCount: recent.length,
            windowStartedAt: recent[0]?.occurredAt ?? null,
            blockedUntil: active?.endsAt ?? null,
          }
        : null;
    },
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
    const { service, create } = fixture({
      existingRequest: true,
    });

    await expect(service.create('user-1', preferences)).rejects.toMatchObject({
      statusCode: 409,
      data: { code: 'REQUEST_ALREADY_EXISTS' },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('consulta la solicitud del usuario autenticado', async () => {
    const { service, findFirst, tx } = fixture({
      pending: true,
    });

    await service.findMyRequest('user-1');
    expect(tx.$executeRaw).not.toHaveBeenCalled();
    expect(tx.$queryRaw).not.toHaveBeenCalled();

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
      },
      orderBy: [{ queuedAt: 'desc' }, { id: 'desc' }],
      include: { offer: true, user: { select: { email: true } } },
    });
  });

  it('modifica preferencias sin alterar la posicion FIFO', async () => {
    const { service, update, request } = fixture({
      pending: true,
    });

    const result = await service.updatePreferences('user-1', preferences);

    expect(result.id).toBe(request.id);
    expect(result.queuedAt).toEqual(request.queuedAt);

    expect(update).toHaveBeenCalledWith({
      where: { id: request.id },
      data: preferences,
    });
  });

  it('cancela una solicitud sin eliminar el historial', async () => {
    const { service, tx, request, update } = fixture({ pending: true });

    const result = await service.cancel('user-1');

    expect(result).toMatchObject({
      id: request.id,
      userId: request.userId,
      status: 'CANCELLED',
      queuedAt: request.queuedAt,
      createdAt: request.createdAt,
      ...preferences,
    });
    expect(
      tx.mentorParticipationRequest.updateManyAndReturn,
    ).toHaveBeenCalledExactlyOnceWith({
      where: { userId: 'user-1', status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('rechaza preferencias inexistentes', async () => {
    const { service, create } = fixture({
      available: 0,
      validPreferences: false,
    });

    await expect(service.create('user-1', preferences)).rejects.toMatchObject({
      statusCode: 400,
    });

    expect(create).not.toHaveBeenCalled();
  });

  it('rechaza usuarios no elegibles', async () => {
    const { service, create } = fixture({
      eligible: false,
    });

    await expect(service.create('user-1', preferences)).rejects.toMatchObject({
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
      Reflect.getMetadata(GUARDS_METADATA, MentorParticipationController),
    ).toEqual([JwtAuthGuard]);

    await controller.create(
      { id: 'jwt-user' } as never,
      preferences,
      '11111111-1111-4111-8111-111111111111',
    );

    expect(create).toHaveBeenCalledWith(
      'jwt-user',
      preferences,
      '11111111-1111-4111-8111-111111111111',
    );
  });
});

describe('HU7-4: limite de intentos y sanciones', () => {
  it('permite cuatro intentos en 24 horas', async () => {
    const { service, getAttemptLimit } = fixture({
      existingRequest: true,
    });

    for (let attempt = 1; attempt <= 4; attempt++) {
      await expect(service.create('user-1', preferences)).rejects.toMatchObject(
        { statusCode: 409 },
      );
    }

    expect(getAttemptLimit()?.attemptCount).toBe(4);
    expect(getAttemptLimit()?.blockedUntil).toBeNull();
  });

  it('devuelve HTTP 429 en el quinto intento', async () => {
    const { service, getAttemptLimit } = fixture({
      existingRequest: true,
    });

    for (let attempt = 1; attempt <= 4; attempt++) {
      await expect(service.create('user-1', preferences)).rejects.toMatchObject(
        { statusCode: 409 },
      );
    }

    await expect(service.create('user-1', preferences)).rejects.toMatchObject({
      statusCode: 429,
    });

    expect(getAttemptLimit()?.attemptCount).toBe(5);
    expect(getAttemptLimit()?.blockedUntil).toBeInstanceOf(Date);
  });

  it('mantiene la sancion durante 72 horas', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-26T12:00:00Z'));

    const { service, getAttemptLimit } = fixture({
      existingRequest: true,
    });

    for (let attempt = 1; attempt <= 4; attempt++) {
      await expect(service.create('user-1', preferences)).rejects.toMatchObject(
        { statusCode: 409 },
      );
    }

    await expect(service.create('user-1', preferences)).rejects.toMatchObject({
      statusCode: 429,
    });

    expect(getAttemptLimit()?.blockedUntil).toEqual(
      new Date('2026-10-29T12:00:00Z'),
    );

    vi.setSystemTime(new Date('2026-10-29T11:59:59Z'));

    await expect(service.create('user-1', preferences)).rejects.toMatchObject({
      statusCode: 429,
    });

    vi.setSystemTime(new Date('2026-10-29T12:00:00Z'));

    await expect(service.create('user-1', preferences)).rejects.toMatchObject({
      statusCode: 409,
    });

    expect(getAttemptLimit()?.attemptCount).toBe(1);
    expect(getAttemptLimit()?.blockedUntil).toBeNull();
  });

  it('reinicia el contador al terminar las 24 horas', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-26T12:00:00Z'));

    const { service, getAttemptLimit } = fixture({
      existingRequest: true,
    });

    await expect(service.create('user-1', preferences)).rejects.toMatchObject({
      statusCode: 409,
    });

    vi.setSystemTime(new Date('2026-10-27T12:00:00Z'));

    await expect(service.create('user-1', preferences)).rejects.toMatchObject({
      statusCode: 409,
    });

    expect(getAttemptLimit()?.attemptCount).toBe(1);
    expect(getAttemptLimit()?.windowStartedAt).toEqual(
      new Date('2026-10-27T12:00:00Z'),
    );
  });
});
