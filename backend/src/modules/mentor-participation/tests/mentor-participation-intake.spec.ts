import { describe, expect, it } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MentorParticipationService } from '../services/mentor-participation.service.js';

const preferences = {
  technicalAreaIds: ['00000000-0000-4000-8000-000000000001'],
  orientationTypeIds: ['00000000-0000-4000-8000-000000000002'],
};
const userIds = [
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-000000000012',
];
const keys = [
  '00000000-0000-4000-8000-000000000021',
  '00000000-0000-4000-8000-000000000022',
];

function fixture(options: { approved?: boolean; active?: boolean; mentor?: boolean;
  existing?: boolean; reservedOffers?: number; inactiveMentor?: boolean } = {}) {
  const attempts: { userId: string; idempotencyKey: string }[] = [];
  const requests: { id: string; userId: string; status: string; requestedAt: Date }[] = [];
  const existing = options.existing ? {
    id: '00000000-0000-4000-8000-000000000031', userId: userIds[0],
    status: 'PENDING', requestedAt: new Date('2026-10-20T12:00:00.000Z'),
  } : null;
  if (existing) requests.push(existing);
  let activeMentors = 0;
  let transactionTail = Promise.resolve();
  const tx = {
    $executeRaw: async () => 0,
    $queryRaw: async (strings: TemplateStringsArray) => {
      const sql = strings.join(' ');
      if (sql.includes('mentor_participation_attempts')) return [{ total: 0n }];
      return [];
    },
    mentorCapacityPolicy: { findUnique: async () => ({ id: 'GLOBAL', percentage: 40 }),
      findUniqueOrThrow: async () => ({ id: 'GLOBAL', percentage: 40 }) },
    mentorParticipationAttempt: {
      findUnique: async () => null,
      create: async ({ data }: { data: { userId: string; idempotencyKey: string } }) => {
        attempts.push(data);
        return data;
      },
    },
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => ({
        id: where.id, email: `${where.id}@umssy.test`, isActive: options.active !== false,
        roles: [{ role: { name: 'titulado' } }, ...(options.mentor ? [{ role: { name: 'mentor' } }] : [])],
        approvedAccessRequest: options.approved === false ? null : { status: { title: 'approved' } },
      }),
      count: async ({ where }: { where: { approvedAccessRequest?: unknown; isActive?: boolean } }) =>
        where.approvedAccessRequest ? 3 : activeMentors + (options.inactiveMentor && !where.isActive ? 1 : 0),
      update: async () => ({}),
    },
    technicalArea: { count: async () => 1 },
    orientationType: { count: async () => 1 },
    mentorSlotOffer: { findMany: async () => [], count: async () => options.reservedOffers ?? 0 },
    mentorParticipationRequest: {
      findFirst: async ({ where }: { where: { userId?: string; status?: string } }) =>
        where.userId ? requests.find((request) => request.userId === where.userId &&
          ['PENDING', 'OFFERED', 'ACTIVE'].includes(request.status)) ?? null : null,
      create: async ({ data }: { data: { userId: string; status: string; requestedAt: Date } }) => {
        const request = { id: `request-${requests.length + 1}`, ...data };
        requests.push(request);
        return request;
      },
    },
    role: { findUnique: async () => ({ id: 'mentor-role' }) },
    userRole: { create: async () => { activeMentors += 1; return {}; } },
    mentorTechnicalArea: { deleteMany: async () => ({}), createMany: async () => ({}) },
    mentorOrientationType: { deleteMany: async () => ({}), createMany: async () => ({}) },
    mentorEmailOutbox: { create: async () => ({}) },
  };
  const prisma = {
    $transaction: async <T>(operation: (client: typeof tx) => Promise<T>): Promise<T> => {
      const previous = transactionTail;
      let release = () => {};
      transactionTail = new Promise<void>((resolve) => { release = resolve; });
      await previous;
      try { return await operation(tx); } finally { release(); }
    },
  } as unknown as PrismaService;
  return { service: new MentorParticipationService(prisma), requests, attempts,
    get activeMentors() { return activeMentors; } };
}

describe('alta HU7 con política de cupos', () => {
  it('rechaza una cuenta sin vínculo de aprobación sin crear solicitud ni intento', async () => {
    const context = fixture({ approved: false });
    await expect(context.service.request(userIds[0], preferences, keys[0])).rejects.toMatchObject({ statusCode: 403 });
    expect(context.requests).toHaveLength(0);
    expect(context.attempts).toHaveLength(0);
  });

  it('rechaza cuentas inactivas y usuarios que ya son mentores', async () => {
    for (const options of [{ active: false }, { mentor: true }]) {
      const context = fixture(options);
      await expect(context.service.activate(userIds[0], preferences, keys[0])).rejects.toMatchObject({
        statusCode: options.mentor ? 409 : 403,
      });
      expect(context.requests).toHaveLength(0);
      expect(context.activeMentors).toBe(0);
    }
  });

  it('cuenta una oferta vigente como cupo ocupado antes de activar', async () => {
    const context = fixture({ reservedOffers: 1 });
    await expect(context.service.activate(userIds[0], preferences, keys[0])).rejects.toMatchObject({
      statusCode: 409, data: { code: 'NO_SLOTS' },
    });
    expect(context.requests).toHaveLength(0);
    expect(context.activeMentors).toBe(0);
  });

  it('no ocupa un cupo con el rol mentor de una cuenta inactiva', async () => {
    const context = fixture({ inactiveMentor: true });
    await expect(context.service.activate(userIds[0], preferences, keys[0])).resolves.toMatchObject({ status: 'ACTIVE' });
    expect(context.activeMentors).toBe(1);
  });

  it('conserva identificador y fecha originales al detectar un duplicado', async () => {
    const context = fixture({ existing: true });
    await expect(context.service.request(userIds[0], preferences, keys[0])).rejects.toMatchObject({
      statusCode: 409,
      data: { code: 'DUPLICATE_REQUEST', id: context.requests[0].id,
        requestedAt: '2026-10-20T12:00:00.000Z' },
    });
    expect(context.requests).toHaveLength(1);
  });

  it('recalcula después del bloqueo: dos altas simultáneas compiten por un único cupo', async () => {
    const context = fixture();
    const outcomes = await Promise.allSettled(userIds.map((userId, index) =>
      context.service.activate(userId, preferences, keys[index])));
    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === 'rejected')).toMatchObject([
      { reason: { statusCode: 409, data: { code: 'NO_SLOTS' } } },
    ]);
    expect(context.activeMentors).toBe(1);
    expect(context.requests).toHaveLength(1);
  });
});
