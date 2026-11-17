import { Test, TestingModule } from '@nestjs/testing';
import { PushSubscriptionsRepository } from '../repositories/push-subscriptions.repository.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

describe('PushSubscriptionsRepository', () => {
  let repo: PushSubscriptionsRepository;
  let prisma: {
    pushSubscription: {
      upsert: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
  };

  const payload = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
    keys: { p256dh: 'k1', auth: 'k2' },
    userAgent: 'Android',
  };

  beforeEach(async () => {
    prisma = {
      pushSubscription: {
        upsert: vi.fn(),
        deleteMany: vi.fn(),
        findMany: vi.fn(),
      },
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PushSubscriptionsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repo = moduleRef.get(PushSubscriptionsRepository);
  });

  describe('upsert', () => {
    it('creates with userId in create and does NOT reassign userId in update', async () => {
      prisma.pushSubscription.upsert.mockResolvedValue(undefined);

      await repo.upsert('user-1', payload);

      const args = prisma.pushSubscription.upsert.mock.calls[0][0];
      expect(args.where).toEqual({ endpoint: payload.endpoint });
      expect(args.create).toEqual(
        expect.objectContaining({
          userId: 'user-1',
          endpoint: payload.endpoint,
          p256dh: payload.keys.p256dh,
          auth: payload.keys.auth,
        }),
      );
      expect(args.update).not.toHaveProperty('userId');
      expect(args.update).toEqual(
        expect.objectContaining({
          p256dh: payload.keys.p256dh,
          auth: payload.keys.auth,
          userAgent: payload.userAgent,
          lastUsedAt: expect.any(Date),
        }),
      );
    });
  });

  describe('deleteByEndpointAndUserId', () => {
    it('filters by both endpoint and userId', async () => {
      prisma.pushSubscription.deleteMany.mockResolvedValue({ count: 1 });

      await repo.deleteByEndpointAndUserId('ep-1', 'user-1');

      expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: { endpoint: 'ep-1', userId: 'user-1' },
      });
    });
  });

  describe('findManyByUserIds', () => {
    it('selects only required fields', async () => {
      prisma.pushSubscription.findMany.mockResolvedValue([]);

      await repo.findManyByUserIds(['u1', 'u2']);

      expect(prisma.pushSubscription.findMany).toHaveBeenCalledWith({
        where: { userId: { in: ['u1', 'u2'] } },
        select: {
          id: true,
          userId: true,
          endpoint: true,
          p256dh: true,
          auth: true,
          userAgent: true,
        },
      });
    });
  });
});