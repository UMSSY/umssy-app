import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsRepository } from '../repositories/notifications.repository.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

describe('NotificationsRepository', () => {
  let repository: NotificationsRepository;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      notification: {
        createMany: vi.fn(),
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
    mockPrisma.notification.createMany.mockResolvedValue({ count: 2 });
    
    const result = await repository.createMany([
      { recipientId: '1', typeId: 't1', title: 'T', body: 'B', link: '/' },
      { recipientId: '2', typeId: 't1', title: 'T', body: 'B', link: '/' },
    ]);

    expect(mockPrisma.notification.createMany).toHaveBeenCalled();
    expect(result).toBe(2);
  });

  it('debe contar solo las notificaciones no leídas', async () => {
    mockPrisma.notification.count.mockResolvedValue(5);
    const count = await repository.countUnread('user-1');

    expect(mockPrisma.notification.count).toHaveBeenCalledWith({
      where: { recipientId: 'user-1', readAt: null },
    });
    expect(count).toBe(5);
  });

  it('debe marcar todas las notificaciones como leídas', async () => {
    await repository.markAllAsRead('user-1');
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
      where: { recipientId: 'user-1', readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });
});