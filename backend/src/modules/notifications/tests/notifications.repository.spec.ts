import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsRepository } from '../repositories/notifications.repository.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

interface MockPrisma {
  notification: {
    createManyAndReturn: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  notificationType: {
    findUnique: ReturnType<typeof vi.fn>;
  };
}

describe('NotificationsRepository', () => {
  let repository: NotificationsRepository;
  let mockPrisma: MockPrisma;

  beforeEach(async () => {
    mockPrisma = {
      notification: {
        createManyAndReturn: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        updateMany: vi.fn(),
      },
      notificationType: {
        findUnique: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<NotificationsRepository>(NotificationsRepository);
  });

  it('debe crear múltiples notificaciones en lote', async () => {
    const created = [
      { id: 'n1', recipientId: '1' },
      { id: 'n2', recipientId: '2' },
    ];
    mockPrisma.notification.createManyAndReturn.mockResolvedValue(created);

    const result = await repository.createMany([
      { recipientId: '1', typeId: 't1', title: 'T', body: 'B', link: '/' },
      { recipientId: '2', typeId: 't1', title: 'T', body: 'B', link: '/' },
    ]);

    expect(mockPrisma.notification.createManyAndReturn).toHaveBeenCalledWith(
      expect.objectContaining({ select: { id: true, recipientId: true } }),
    );
    expect(result).toEqual(created);
  });

  it('debe contar solo las notificaciones no leídas', async () => {
    mockPrisma.notification.count.mockResolvedValue(5);
    const count = await repository.countUnread('user-1');

    expect(mockPrisma.notification.count).toHaveBeenCalledWith({
      where: {
        recipientId: 'user-1',
        readAt: null,
        type: { code: { notIn: ['CHAT_MESSAGE', 'CHAT_GROUP_MESSAGE'] } },
      },
    });
    expect(count).toBe(5);
  });

  it('comprueba de forma durable un grupo por tipo y destinatario', async () => {
    mockPrisma.notification.findFirst.mockResolvedValue({ id: 'n1' });

    await expect(
      repository.hasGroupedNotification(
        'user-1',
        'MENTOR_SLOT_OFFERED',
        'mentor-slot-offer:offer-1',
      ),
    ).resolves.toBe(true);
    expect(mockPrisma.notification.findFirst).toHaveBeenCalledWith({
      where: {
        recipientId: 'user-1',
        groupKey: 'mentor-slot-offer:offer-1',
        type: { code: 'MENTOR_SLOT_OFFERED' },
      },
      select: { id: true },
    });
  });

  it('debe marcar todas las notificaciones como leídas', async () => {
    await repository.markAllAsRead('user-1');
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
      where: {
        recipientId: 'user-1',
        readAt: null,
        type: { code: { notIn: ['CHAT_MESSAGE', 'CHAT_GROUP_MESSAGE'] } },
      },
      data: { readAt: expect.any(Date) },
    });
  });

  it('debe buscar el estado de lectura solo entre los avisos del usuario', async () => {
    mockPrisma.notification.findFirst.mockResolvedValue({ readAt: null });

    const result = await repository.findReadStateById('n1', 'user-1');

    expect(mockPrisma.notification.findFirst).toHaveBeenCalledWith({
      where: { id: 'n1', recipientId: 'user-1' },
      select: { readAt: true },
    });
    expect(result).toEqual({ readAt: null });
  });
});
