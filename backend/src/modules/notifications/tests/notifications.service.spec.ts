import { vi, describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { AppointmentParticipantRole } from '../../appointments/enums/appointment-participant-role.enum.js';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, Logger } from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service.js';
import { NotificationsRepository } from '../repositories/notifications.repository.js';
import { PreferencesRepository } from '../repositories/preferences.repository.js';
import { NotificationUserLookupRepository } from '../repositories/notification-user-lookup.repository.js';
import { PushDispatcherService } from '../services/push-dispatcher.service.js';
import { MailDispatcherService } from '../services/mail-dispatcher.service.js';
import { NotificationGateway } from '../gateways/notification.gateway.js';
import { AppVisibilityService } from '../services/app-visibility.service.js';
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

interface MockAppVisibilityService {
  isVisible: ReturnType<typeof vi.fn>;
}

describe('NotificationsService', () => {
  let service: NotificationsService;

  let mockNotificationsRepo: MockNotificationsRepo;
  let mockPreferencesRepo: MockPreferencesRepo;
  let mockUserLookupRepo: MockUserLookupRepo;
  let mockPushDispatcher: MockPushDispatcher;
  let mockMailDispatcher: MockMailDispatcher;
  let mockGateway: MockGateway;
  let mockAppVisibilityService: MockAppVisibilityService;

  const validPayload = {
    counterpartName: 'Test',
    date: '2023-01-01',
    time: '10:00',
    topic: 'Test Topic',
    recipientRole: AppointmentParticipantRole.STUDENT,
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
      createMany: vi
        .fn()
        .mockResolvedValue([{ id: 'notification-1', recipientId: 'user-2' }]),
    };
    mockPreferencesRepo = { findManyByUserIds: vi.fn().mockResolvedValue([]) };
    mockUserLookupRepo = { hasBlockBetween: vi.fn().mockResolvedValue(false) };
    mockPushDispatcher = {
      dispatchToUsers: vi
        .fn()
        .mockResolvedValue({ status: 'sent', deliveries: [] }),
    };
    mockMailDispatcher = {
      dispatchToUsers: vi
        .fn()
        .mockResolvedValue({ status: 'sent', deliveries: [] }),
    };
    mockGateway = { emitToUser: vi.fn() };
    mockAppVisibilityService = { isVisible: vi.fn().mockReturnValue(false) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NotificationsRepository, useValue: mockNotificationsRepo },
        { provide: PreferencesRepository, useValue: mockPreferencesRepo },
        {
          provide: NotificationUserLookupRepository,
          useValue: mockUserLookupRepo,
        },
        { provide: PushDispatcherService, useValue: mockPushDispatcher },
        { provide: MailDispatcherService, useValue: mockMailDispatcher },
        { provide: NotificationGateway, useValue: mockGateway },
        { provide: AppVisibilityService, useValue: mockAppVisibilityService },
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

    mockNotificationsRepo.createMany.mockImplementation(
      (data: { recipientId: string }[]) =>
        Promise.resolve(
          data.map((item) => ({
            id: `notification-${item.recipientId}`,
            recipientId: item.recipientId,
          })),
        ),
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
      expect.any(Map),
    );

    expect(mockMailDispatcher.dispatchToUsers).toHaveBeenCalledWith(
      ['user-3'],
      expect.any(String),
      expect.any(String),
      expect.any(String),
      undefined,
    );
  });

  it('debe aislar fallos de canal (si push falla, el resto continúa)', async () => {
    mockPreferencesRepo.findManyByUserIds.mockResolvedValue([
      { userId: 'user-2', pushEnabled: true, emailEnabled: true },
    ]);
    mockPushDispatcher.dispatchToUsers.mockRejectedValue(
      new Error('Push down'),
    );

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

  it('entrega al despachador de correo el renderizador del dominio y devuelve la entrega por destinatario y canal', async () => {
    mockNotificationsRepo.findTypeByCode.mockResolvedValue({
      id: 'type-reminder',
      code: 'SURVEY_REMINDER',
      sendsPush: true,
      sendsEmail: true,
    });
    mockPreferencesRepo.findManyByUserIds.mockResolvedValue([
      { userId: 'user-2', pushEnabled: true, emailEnabled: true },
    ]);
    mockPushDispatcher.dispatchToUsers.mockResolvedValue({
      status: 'skipped',
      deliveries: [
        { recipientId: 'user-2', channel: 'push', status: 'skipped' },
      ],
    });
    mockMailDispatcher.dispatchToUsers.mockResolvedValue({
      status: 'sent',
      deliveries: [{ recipientId: 'user-2', channel: 'email', status: 'sent' }],
    });
    const renderMail = vi.fn();

    const result = await service.notify({
      recipientIds: ['user-2'],
      actorId: 'admin-1',
      type: NotificationType.SURVEY_REMINDER,
      payload: {
        surveyTitle: 'Empleabilidad',
        closesAtFormatted: '30/11/2026 20:00.',
      },
      actionUrl: 'http://localhost:3000/surveys/survey-1',
      renderMail,
    });

    expect(mockMailDispatcher.dispatchToUsers).toHaveBeenCalledWith(
      ['user-2'],
      expect.any(String),
      expect.any(String),
      'http://localhost:3000/surveys/survey-1',
      renderMail,
    );
    expect(result.deliveries).toEqual([
      { recipientId: 'user-2', channel: 'push', status: 'skipped' },
      { recipientId: 'user-2', channel: 'email', status: 'sent' },
    ]);
  });

  it('debe enviar solo el correo cuando el reintento lo pide por canal', async () => {
    const result = await service.notify({
      recipientIds: ['user-2'],
      actorId: 'user-1',
      type: NotificationType.APPOINTMENT_BOOKED,
      payload: validPayload,
      actionUrl: '/test',
      channels: ['EMAIL'],
    });

    expect(mockNotificationsRepo.createMany).not.toHaveBeenCalled();
    expect(mockGateway.emitToUser).not.toHaveBeenCalled();
    expect(mockPushDispatcher.dispatchToUsers).not.toHaveBeenCalled();
    expect(mockMailDispatcher.dispatchToUsers).toHaveBeenCalledOnce();
    expect(result).toEqual({
      inAppCount: 0,
      pushStatus: 'skipped',
      emailStatus: 'sent',
      deliveries: [],
    });
  });

  it('debe enviar solo el push cuando el reintento lo pide por canal', async () => {
    mockPreferencesRepo.findManyByUserIds.mockResolvedValue([
      { userId: 'user-2', pushEnabled: true, emailEnabled: true },
    ]);

    const result = await service.notify({
      recipientIds: ['user-2'],
      actorId: 'user-1',
      type: NotificationType.APPOINTMENT_BOOKED,
      payload: validPayload,
      actionUrl: '/test',
      channels: ['PUSH'],
    });

    expect(mockNotificationsRepo.createMany).not.toHaveBeenCalled();
    expect(mockGateway.emitToUser).not.toHaveBeenCalled();
    expect(mockPushDispatcher.dispatchToUsers).toHaveBeenCalledOnce();
    expect(mockMailDispatcher.dispatchToUsers).not.toHaveBeenCalled();
    expect(result).toEqual({
      inAppCount: 0,
      pushStatus: 'sent',
      emailStatus: 'skipped',
      deliveries: [],
    });
  });

  it('debe crear solo la notificación en la aplicación cuando el reintento lo pide por canal', async () => {
    mockPreferencesRepo.findManyByUserIds.mockResolvedValue([
      { userId: 'user-2', pushEnabled: true, emailEnabled: true },
    ]);

    const result = await service.notify({
      recipientIds: ['user-2'],
      actorId: 'user-1',
      type: NotificationType.APPOINTMENT_BOOKED,
      payload: validPayload,
      actionUrl: '/test',
      channels: ['IN_APP'],
    });

    expect(mockNotificationsRepo.createMany).toHaveBeenCalledOnce();
    expect(mockGateway.emitToUser).toHaveBeenCalledOnce();
    expect(mockPushDispatcher.dispatchToUsers).not.toHaveBeenCalled();
    expect(mockMailDispatcher.dispatchToUsers).not.toHaveBeenCalled();
    expect(result).toEqual({
      inAppCount: 1,
      pushStatus: 'skipped',
      emailStatus: 'skipped',
      deliveries: [],
    });
  });

  it('no debe enviar push a un destinatario con la app visible', async () => {
    mockNotificationsRepo.createMany.mockResolvedValue([
      { id: 'notification-1', recipientId: 'user-2' },
      { id: 'notification-2', recipientId: 'user-3' },
    ]);
    mockPreferencesRepo.findManyByUserIds.mockResolvedValue([
      { userId: 'user-2', pushEnabled: true, emailEnabled: false },
      { userId: 'user-3', pushEnabled: true, emailEnabled: false },
    ]);
    mockAppVisibilityService.isVisible.mockImplementation(
      (userId: string) => userId === 'user-2',
    );

    await service.notify({
      recipientIds: ['user-2', 'user-3'],
      actorId: 'user-1',
      type: NotificationType.APPOINTMENT_BOOKED,
      payload: validPayload,
      actionUrl: '/test',
    });

    expect(mockPushDispatcher.dispatchToUsers).toHaveBeenCalledWith(
      ['user-3'],
      expect.any(String),
      expect.any(String),
      expect.any(String),
      undefined,
      expect.any(Map),
    );
    expect(mockGateway.emitToUser).toHaveBeenCalledTimes(2);
    expect(mockGateway.emitToUser).toHaveBeenCalledWith(
      'user-2',
      'notification:new',
      expect.objectContaining({
        typeCode: NotificationType.APPOINTMENT_BOOKED,
        actionUrl: '/test',
      }),
    );
  });

  it('debe pasar al push el id del aviso creado para cada destinatario', async () => {
    mockPreferencesRepo.findManyByUserIds.mockResolvedValue([
      { userId: 'user-2', pushEnabled: true, emailEnabled: false },
    ]);
    mockNotificationsRepo.createMany.mockResolvedValue([
      { id: 'notification-9', recipientId: 'user-2' },
    ]);

    await service.notify({
      recipientIds: ['user-2'],
      actorId: 'user-1',
      type: NotificationType.APPOINTMENT_BOOKED,
      payload: validPayload,
      actionUrl: '/appointments',
    });

    const notificationIds = mockPushDispatcher.dispatchToUsers.mock
      .calls[0][5] as Map<string, string>;
    expect(notificationIds.get('user-2')).toBe('notification-9');
  });

  it('no vuelve a enviar por canales externos un aviso de radar ya creado', async () => {
    mockNotificationsRepo.createMany.mockResolvedValue([]);
    mockPreferencesRepo.findManyByUserIds.mockResolvedValue([
      { userId: 'user-2', pushEnabled: true, emailEnabled: true },
    ]);

    const result = await service.notify({
      recipientIds: ['user-2'],
      type: NotificationType.RADAR_PUBLISHED,
      payload: { radarVersion: '2', publishedAt: '2026-11-17T12:00:00Z' },
      actionUrl: '/profile/radar?snapshot=snapshot-2',
      groupKey: 'radar:snapshot-2',
    });

    expect(result).toEqual({
      inAppCount: 0,
      pushStatus: 'skipped',
      emailStatus: 'skipped',
      deliveries: [],
    });
    expect(mockPushDispatcher.dispatchToUsers).not.toHaveBeenCalled();
    expect(mockMailDispatcher.dispatchToUsers).not.toHaveBeenCalled();
    expect(mockGateway.emitToUser).not.toHaveBeenCalled();
  });
});
