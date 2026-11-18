import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MessageService } from '../services/message.service.js';
import { ConnectionRequestService } from '../services/connection-request.service.js';
import { ChatVisibilityService } from '../services/chat-visibility.service.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';
import { NOTIFICATION_TEMPLATES } from '../../notifications/constants/notification-templates.constants.js';

describe('HU-20: Chat & Connection Notifications', () => {
  let messageService: MessageService;
  let connectionRequestService: ConnectionRequestService;
  let visibilityService: ChatVisibilityService;

  let mockMessageRepo: any;
  let mockConversationRepo: any;
  let mockParticipantRepo: any;
  let mockStatusService: any;
  let mockBlockService: any;
  let mockPolicyService: any;
  let mockMessageMapper: any;
  let mockNotificationsService: any;
  let mockUserLookupRepo: any;
  let mockConnectionRequestRepo: any;
  let mockChatGateway: any;
  let mockEventsService: any;

  beforeEach(() => {
    visibilityService = new ChatVisibilityService();

    mockMessageRepo = {
      create: vi.fn().mockResolvedValue({
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-a',
        content: 'Hola amigo',
        sentAt: new Date(),
      }),
    };

    mockConversationRepo = {
      findById: vi.fn().mockResolvedValue({
        id: 'conv-1',
        userAId: 'user-a',
        userBId: 'user-b',
        eventId: null,
      }),
      touchLastMessage: vi.fn().mockResolvedValue({}),
      findParticipantsByConversationId: vi
        .fn()
        .mockResolvedValue([{ userId: 'user-a' }, { userId: 'user-b' }]),
      findByOrderedPair: vi.fn().mockResolvedValue({ id: 'conv-direct-1' }),
    };

    mockEventsService = {
      findById: vi.fn().mockResolvedValue({
        id: 'event-1',
        title: 'Taller de Empleabilidad',
      }),
    };

    mockParticipantRepo = {
      findByConversationAndUser: vi.fn().mockResolvedValue({
        userId: 'user-b',
        lastReadAt: new Date(Date.now() - 60000),
      }),
      markRead: vi.fn().mockResolvedValue({}),
      countUnread: vi.fn().mockResolvedValue(4),
    };

    mockStatusService = {
      getSentId: vi.fn().mockResolvedValue('sent-status-id'),
    };

    mockBlockService = {
      isBlockedBetween: vi.fn().mockResolvedValue(false),
    };

    mockPolicyService = {
      assertCanCommunicate: vi
        .fn()
        .mockResolvedValue({ hasValidatedApplication: false }),
    };

    mockMessageMapper = {
      toResponse: vi.fn().mockImplementation((m) => m),
    };

    mockNotificationsService = {
      notify: vi.fn().mockResolvedValue({
        inAppCount: 1,
        pushStatus: 'delivered',
        emailStatus: 'skipped',
      }),
    };

    mockUserLookupRepo = {
      findActiveById: vi.fn().mockImplementation((id: string) => {
        if (id === 'user-a') {
          return Promise.resolve({
            id: 'user-a',
            firstName: 'Usuario',
            lastName: 'De Prueba',
          });
        }
        if (id === 'user-b') {
          return Promise.resolve({
            id: 'user-b',
            firstName: 'Contacto',
            lastName: 'Destino',
          });
        }
        return Promise.resolve(null);
      }),
      hasBlockBetween: vi.fn().mockResolvedValue(false),
    };

    mockConnectionRequestRepo = {
      findPendingRequest: vi.fn().mockResolvedValue(null),
      findAcceptedRequest: vi.fn().mockResolvedValue(null),
      findStatusByTitle: vi.fn().mockResolvedValue({ id: 'status-pending' }),
      create: vi.fn().mockResolvedValue({
        id: 'req-1',
        senderId: 'user-a',
        receiverId: 'user-b',
      }),
      findById: vi.fn().mockResolvedValue({
        id: 'req-1',
        senderId: 'user-a',
        receiverId: 'user-b',
        status: { title: 'PENDING' },
      }),
      updatePendingStatus: vi.fn().mockResolvedValue({ count: 1 }),
    };

    mockChatGateway = {
      notifyUser: vi.fn(),
      broadcastMessage: vi.fn(),
    };

    messageService = new MessageService(
      mockMessageRepo,
      mockConversationRepo,
      mockParticipantRepo,
      mockStatusService,
      mockBlockService,
      mockPolicyService,
      mockMessageMapper,
      mockNotificationsService,
      visibilityService,
      mockUserLookupRepo,
      mockEventsService,
    );

    connectionRequestService = new ConnectionRequestService(
      mockConnectionRequestRepo,
      { isBlockedBetween: vi.fn().mockResolvedValue(false) } as any,
      mockUserLookupRepo,
      mockChatGateway,
      mockConversationRepo,
      mockNotificationsService,
    );
  });

  describe('Criterio 1: Mensaje de chat privado con receptor desconectado/en otra pantalla', () => {
    it('debe disparar notificación CHAT_MESSAGE con nombre del remitente y actionUrl de conversación', async () => {
      await messageService.send({
        conversationId: 'conv-1',
        senderId: 'user-a',
        content: 'Hola amigo',
      });

      expect(mockNotificationsService.notify).toHaveBeenCalledTimes(1);
      const call = mockNotificationsService.notify.mock.calls[0][0];
      expect(call.type).toBe(NotificationType.CHAT_MESSAGE);
      expect(call.recipientIds).toEqual(['user-b']);
      expect(call.actorId).toBe('user-a');
      expect(call.payload.senderName).toBe('Usuario De Prueba');
      expect(call.payload.previewText).toBe('Hola amigo');
      expect(call.actionUrl).toBe('/chat?conversationId=conv-1');
      expect(call.groupKey).toBe('conv-1');

      const template = NOTIFICATION_TEMPLATES[NotificationType.CHAT_MESSAGE];
      expect(template.renderTitle(call.payload)).toBe(
        'Mensaje nuevo de: Usuario De Prueba',
      );
    });
  });

  describe('Criterio 4: Supresión cuando el receptor tiene el chat abierto', () => {
    it('NO debe llamar a notify() si el receptor tiene la conversación activa y enfocada', async () => {
      visibilityService.setConversationVisibility(
        'user-b',
        'socket-b1',
        'conv-1',
        true,
      );

      await messageService.send({
        conversationId: 'conv-1',
        senderId: 'user-a',
        content: 'Mensaje con chat abierto',
      });

      expect(mockNotificationsService.notify).not.toHaveBeenCalled();
    });

    it('SÍ debe llamar a notify() si el receptor tiene el chat abierto en otra conversación', async () => {
      visibilityService.setConversationVisibility(
        'user-b',
        'socket-b1',
        'conv-other',
        true,
      );

      await messageService.send({
        conversationId: 'conv-1',
        senderId: 'user-a',
        content: 'Mensaje para conv-1',
      });

      expect(mockNotificationsService.notify).toHaveBeenCalledTimes(1);
    });

    it('SÍ debe llamar a notify() si el receptor tenía el chat abierto pero la ventana perdió el foco', async () => {
      visibilityService.setConversationVisibility(
        'user-b',
        'socket-b1',
        'conv-1',
        false,
      );

      await messageService.send({
        conversationId: 'conv-1',
        senderId: 'user-a',
        content: 'Mensaje con ventana desenfocada',
      });

      expect(mockNotificationsService.notify).toHaveBeenCalledTimes(1);
    });
  });

  describe('Criterio 2: Mensaje en chat grupal', () => {
    it('debe disparar notificación CHAT_GROUP_MESSAGE con el nombre del grupo', async () => {
      mockConversationRepo.findById.mockResolvedValueOnce({
        id: 'conv-group-1',
        eventId: 'event-1',
      });

      await messageService.send({
        conversationId: 'conv-group-1',
        senderId: 'user-a',
        content: 'Nos vemos en el taller',
      });

      expect(mockEventsService.findById).toHaveBeenCalledWith('event-1');
      expect(mockNotificationsService.notify).toHaveBeenCalledTimes(1);
      const call = mockNotificationsService.notify.mock.calls[0][0];
      expect(call.type).toBe(NotificationType.CHAT_GROUP_MESSAGE);
      expect(call.payload.groupName).toBe('Taller de Empleabilidad');
      expect(call.payload.senderName).toBe('Usuario De Prueba');

      const template =
        NOTIFICATION_TEMPLATES[NotificationType.CHAT_GROUP_MESSAGE];
      expect(template.renderTitle(call.payload)).toBe(
        'Mensaje nuevo en: Taller de Empleabilidad',
      );
    });
  });

  describe('Criterio 3 & 4: Agrupación y contador de mensajes acumulados', () => {
    it('debe incluir el contador de mensajes si messageCount > 1', async () => {
      mockParticipantRepo.countUnread.mockResolvedValueOnce(4);

      await messageService.send({
        conversationId: 'conv-1',
        senderId: 'user-a',
        content: 'Último mensaje',
      });

      const call = mockNotificationsService.notify.mock.calls[0][0];
      expect(call.payload.messageCount).toBe(4);

      const template = NOTIFICATION_TEMPLATES[NotificationType.CHAT_MESSAGE];
      const body = template.renderBody(call.payload);
      expect(body).toBe('Último mensaje (4 mensajes)');
    });

    it('NO debe mostrar el contador entre paréntesis si messageCount <= 1', () => {
      const template = NOTIFICATION_TEMPLATES[NotificationType.CHAT_MESSAGE];
      const body = template.renderBody({
        senderName: 'Usuario',
        previewText: 'Hola primer mensaje',
        messageCount: 1,
      });
      expect(body).toBe('Hola primer mensaje');
    });
  });

  describe('Criterio 5: Adjuntos muestran exclusivamente Imagen o Documento PDF', () => {
    it('debe despachar "Imagen" para adjuntos de imagen y "Documento PDF" para documentos', async () => {
      await messageService.dispatchMessageNotification({
        conversationId: 'conv-1',
        senderId: 'user-a',
        previewText: 'Imagen',
      });

      let call = mockNotificationsService.notify.mock.calls[0][0];
      expect(call.payload.previewText).toBe('Imagen');

      await messageService.dispatchMessageNotification({
        conversationId: 'conv-1',
        senderId: 'user-a',
        previewText: 'Documento PDF',
      });

      call = mockNotificationsService.notify.mock.calls[1][0];
      expect(call.payload.previewText).toBe('Documento PDF');
    });
  });

  describe('Criterio 6 & 7: Solicitudes de conexión recibida y aceptada', () => {
    it('send() debe disparar CONNECTION_REQUEST_RECEIVED con canal Push+Email y deep link a requests', async () => {
      await connectionRequestService.send('user-a', 'user-b');

      expect(mockNotificationsService.notify).toHaveBeenCalledTimes(1);
      const call = mockNotificationsService.notify.mock.calls[0][0];
      expect(call.type).toBe(NotificationType.CONNECTION_REQUEST_RECEIVED);
      expect(call.recipientIds).toEqual(['user-b']);
      expect(call.actionUrl).toBe('/chat?tab=requests');
      expect(call.payload.senderName).toBe('Usuario De Prueba');

      const template =
        NOTIFICATION_TEMPLATES[NotificationType.CONNECTION_REQUEST_RECEIVED];
      expect(template.renderTitle(call.payload)).toBe(
        'Nueva solicitud de conexión',
      );
    });

    it('accept() debe disparar CONNECTION_REQUEST_ACCEPTED y deep link a la conversación', async () => {
      await connectionRequestService.accept('req-1', 'user-b');

      expect(mockNotificationsService.notify).toHaveBeenCalledTimes(1);
      const call = mockNotificationsService.notify.mock.calls[0][0];
      expect(call.type).toBe(NotificationType.CONNECTION_REQUEST_ACCEPTED);
      expect(call.recipientIds).toEqual(['user-a']);
      expect(call.actionUrl).toBe('/chat?conversationId=conv-direct-1');
      expect(call.payload.receiverName).toBe('Contacto Destino');

      const template =
        NOTIFICATION_TEMPLATES[NotificationType.CONNECTION_REQUEST_ACCEPTED];
      expect(template.renderTitle(call.payload)).toBe(
        'Solicitud de conexión aceptada',
      );
    });
  });

  describe('Criterio 9: Bloqueos y anti-autor', () => {
    it('NO debe notificar si existe bloqueo entre emisor y receptor', async () => {
      mockBlockService.isBlockedBetween.mockResolvedValueOnce(true);

      await messageService
        .send({
          conversationId: 'conv-1',
          senderId: 'user-a',
          content: 'Mensaje bloqueado',
        })
        .catch(() => {});

      expect(mockNotificationsService.notify).not.toHaveBeenCalled();
    });
  });
});