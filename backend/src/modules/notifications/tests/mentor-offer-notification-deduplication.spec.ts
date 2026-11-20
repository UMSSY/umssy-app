import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { NotificationsRepository } from '../repositories/notifications.repository.js';

describe('deduplicación central de ofertas de mentoría', () => {
  it('serializa por destinatario y oferta y omite el aviso ya creado', async () => {
    let existing = false;
    let held = Promise.resolve();
    const tx = {
      $executeRaw: vi.fn(),
      notification: {
        findFirst: vi.fn(async () =>
          existing ? { id: 'notification-id' } : null,
        ),
        create: vi.fn(async () => {
          existing = true;
          return {
            id: 'notification-id',
            recipientId: 'recipient-id',
          };
        }),
      },
    };
    const database = {
      $transaction: vi.fn(async (run: (client: typeof tx) => unknown) => {
        const previous = held;
        let release = () => undefined;
        held = new Promise<void>((resolve) => {
          release = resolve;
        });
        await previous;
        try {
          return await run(tx);
        } finally {
          release();
        }
      }),
    };
    const repository = new NotificationsRepository(
      database as unknown as PrismaService,
    );
    const notification = {
      recipientId: 'recipient-id',
      typeId: 'mentor-slot-offered-type',
      title: 'Cupo disponible para ser mentor',
      body: 'Confirma tu participación.',
      link: '/mentors/participation',
      groupKey: 'mentor-slot-offer:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    };

    const results = await Promise.all([
      repository.createMany([notification]),
      repository.createMany([notification]),
    ]);

    expect(
      results.map((result) => result.length).sort((a, b) => a - b),
    ).toEqual([0, 1]);

    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
    expect(tx.notification.create).toHaveBeenCalledTimes(1);
    expect(tx.notification.findFirst).toHaveBeenCalledWith({
      where: {
        recipientId: notification.recipientId,
        typeId: notification.typeId,
        groupKey: notification.groupKey,
      },
      select: { id: true },
    });
  });
});
