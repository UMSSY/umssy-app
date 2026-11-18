import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { NotificationsRepository } from '../repositories/notifications.repository.js';

describe('Radar publication notification ownership', () => {
  it('creates an ID through Prisma and skips an existing recipient snapshot group', async () => {
    const tx = {
      $queryRaw: vi.fn(),
      notification: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: 'generated-id' }),
        create: vi
          .fn()
          .mockResolvedValue({ id: 'generated-id', recipientId: 'owner' }),
      },
    };
    const db = {
      $transaction: vi.fn(async (run: (client: typeof tx) => unknown) =>
        run(tx),
      ),
    };
    const repository = new NotificationsRepository(
      db as unknown as PrismaService,
    );
    const notice = {
      recipientId: 'owner',
      typeId: 'radar-type',
      title: 'Radar',
      body: 'Version 2',
      link: '/profile/radar?snapshot=snapshot-2',
      groupKey: 'radar:snapshot-2',
    };
    await expect(repository.createMany([notice])).resolves.toEqual([
      { id: 'generated-id', recipientId: 'owner' },
    ]);
    await expect(repository.createMany([notice])).resolves.toEqual([]);
    expect(tx.notification.create).toHaveBeenCalledTimes(1);
    expect(tx.notification.create).toHaveBeenCalledWith({
      data: notice,
      select: { id: true, recipientId: true },
    });
    expect(tx.$queryRaw).toHaveBeenCalledTimes(2);
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      tx.notification.findFirst.mock.invocationCallOrder[0],
    );
  });
});
