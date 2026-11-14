import { vi, describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, Logger } from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service.js';
import { NotificationsRepository } from '../repositories/notifications.repository.js';
import { PreferencesRepository } from '../repositories/preferences.repository.js';
import { NotificationUserLookupRepository } from '../repositories/notification-user-lookup.repository.js';
import { PushDispatcherService } from '../services/push-dispatcher.service.js';
import { MailDispatcherService } from '../services/mail-dispatcher.service.js';
import { NotificationGateway } from '../gateways/notification.gateway.js';
import { NotificationType } from '../types/notification-type.enum.js';

interface MockNotificationsRepo {
  findTypeByCode: ReturnType<typeof vi.fn>;
  createMany: ReturnType<typeof vi.fn>;
}

interface MockPreferencesRepo {
  findManyByUserIds: ReturnType<typeof vi.fn>;
}

interface MockUserLookupRepo {
  hasBlockBetween: ReturnType<typeof vi.fn>;
}

interface MockPushDispatcher {
  dispatchToUsers: ReturnType<typeof vi.fn>;
}

interface MockMailDispatcher {
  dispatchToUsers: ReturnType<typeof vi.fn>;
}

interface MockGateway {
  emitToUser: ReturnType<typeof vi.fn>;
}

describe('NotificationsService', () => {
  let service: NotificationsService;

  let mockNotificationsRepo: MockNotificationsRepo;
  let mockPreferencesRepo: MockPreferencesRepo;
  let mockUserLookupRepo: MockUserLookupRepo;
  let mockPushDispatcher: MockPushDispatcher;
  let mockMailDispatcher: MockMailDispatcher;
  let mockGateway: MockGateway;

  const validPayload = {
    counterpartName: 'Test',
    date: '2023-01-01',
    time: '10:00',
    topic: 'Test Topic',
  };

  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  beforeEach(async () => {
    mockNotificationsRepo = {
      findTypeByCode: vi.fn().mockResolvedValue({
        id: 'type-123',
        code: 'APPOINTMENT_BOOKED',
        sendsPush: true,
        sendsEmail: true,
      }),
      createMany: vi.fn().mockResolvedValue(1),
    };
    mockPreferencesRepo = { findManyByUserIds: vi.fn().mockResolvedValue([]) };
    mockUserLookupRepo = { hasBlockBetween: vi.fn().mockResolvedValue(false) };
    mockPushDispatcher = { dispatchToUsers: vi.fn().mockResolvedValue('sent') };
    mockMailDispatcher = { dispatchToUsers: vi.fn().mockResolvedValue('sent') };
    mockGateway = { emitToUser: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NotificationsRepository, useValue: mockNotificationsRepo },
        { provide: PreferencesRepository, useValue: mockPreferencesRepo },
        { provide: NotificationUserLookupRepository, useValue: mockUserLookupRepo },
        { provide: PushDispatcherService, useValue: mockPushDispatcher },
        { provide: MailDispatcherService, useValue: mockMailDispatcher },
        { provide: NotificationGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('debe omitir la notificación si el actor es el mismo destinatario (Anti-Autor)', async () => {
    const result = await service.notify({
      recipientIds: ['user-1'],
      actorId: 'user-1',
      type: NotificationType.APPOINTMENT_BOOKED,
      payload: validPayload,
      actionUrl: '/test',
    });

    expect(result.inAppCount).toBe(0);
    expect(mockNotificationsRepo.createMany).not.toHaveBeenCalled();
    expect(mockPushDispatcher.dispatchToUsers).not.toHaveBeenCalled();
  });

  it('debe omitir la notificación si hay un bloqueo entre los usuarios', async () => {
    mockUserLookupRepo.hasBlockBetween.mockResolvedValue(true);

    const result = await service.notify({
      recipientIds: ['user-2'],
      actorId: 'user-1',
      type: NotificationType.APPOINTMENT_BOOKED,
      payload: validPayload,
      actionUrl: '/test',
    });

    expect(result.inAppCount).toBe(0);
    expect(mockNotificationsRepo.createMany).not.toHaveBeenCalled();
  });

  it('debe lanzar NotFoundException si el tipo no está en la BD', async () => {
    mockNotificationsRepo.findTypeByCode.mockResolvedValue(null);

    await expect(
      service.notify({
        recipientIds: ['user-2'],
        type: NotificationType.APPOINTMENT_BOOKED,
        payload: validPayload,
        actionUrl: '/test',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('debe respetar las preferencias y enrutar solo a los canales correctos (Fan-out)', async () => {
    mockPreferencesRepo.findManyByUserIds.mockResolvedValue([
      { userId: 'user-2', pushEnabled: true, emailEnabled: false },
      { userId: 'user-3', pushEnabled: false, emailEnabled: true },
    ]);

    mockNotificationsRepo.createMany.mockImplementation((data: unknown[]) =>
      Promise.resolve(data.length),
    );

    const result = await service.notify({
      recipientIds: ['user-2', 'user-3'],
      actorId: 'user-1',
      type: NotificationType.APPOINTMENT_BOOKED,
      payload: validPayload,
      actionUrl: '/test',
    });

    expect(result.inAppCount).toBe(2);

    expect(mockPushDispatcher.dispatchToUsers).toHaveBeenCalledWith(
      ['user-2'],
      expect.any(String),
      expect.any(String),
      expect.any(String),
      undefined,
    );

    expect(mockMailDispatcher.dispatchToUsers).toHaveBeenCalledWith(
      ['user-3'],
      expect.any(String),
      expect.any(String),
      expect.any(String),
    );
  });

  it('debe aislar fallos de canal (si push falla, el resto continúa)', async () => {
    mockPreferencesRepo.findManyByUserIds.mockResolvedValue([
      { userId: 'user-2', pushEnabled: true, emailEnabled: true },
    ]);
    mockPushDispatcher.dispatchToUsers.mockRejectedValue(new Error('Push down'));

    const result = await service.notify({
      recipientIds: ['user-2'],
      actorId: 'user-1',
      type: NotificationType.APPOINTMENT_BOOKED,
      payload: validPayload,
      actionUrl: '/test',
    });

    expect(result.inAppCount).toBe(1);
    expect(result.pushStatus).toBe('failed');
    expect(result.emailStatus).toBe('sent');
  });
});