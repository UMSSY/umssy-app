import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChatGateway } from '../gateways/chat.gateway.js';
import { SessionService } from '../../../common/services/session.service.js';
import { ChatService } from '../services/chat.service.js';
import { UserPresenceService } from '../services/user-presence.service.js';
import { MessageService } from '../services/message.service.js';
import type { Socket, Server } from 'socket.io';
import { EventRoomService } from '../services/event-room.service.js';
import { NotRegisteredForEventException } from '../exceptions/not-registered-for-event.exception.js';

const REGISTRATION_ID = '11111111-1111-4111-8111-111111111111';

describe('ChatGateway (HU-5 Handshake)', () => {
  let gateway: ChatGateway;
  let jwtService: JwtService;
  let sessionService: SessionService;
  let messageService: MessageService;
  let eventRoomService: EventRoomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: JwtService,
          useValue: { verifyAsync: vi.fn() },
        },
        {
          provide: SessionService,
          useValue: { getAuthenticatedUser: vi.fn() },
        },
        {
          provide: ChatService,
          useValue: { getActiveConversationIds: vi.fn() },
        },
        {
          provide: MessageService,
          useValue: { send: vi.fn() },
        },
        {
          provide: EventRoomService,
          useValue: { joinEventRoom: vi.fn() },
        },
        {
          provide: UserPresenceService,
          useValue: { markOnline: vi.fn(), markOffline: vi.fn() },
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    messageService = module.get<MessageService>(MessageService);
    jwtService = module.get<JwtService>(JwtService);
    sessionService = module.get<SessionService>(SessionService);
    eventRoomService = module.get<EventRoomService>(EventRoomService);
  });

  it('debe rechazar la conexión si no se envía un token JWT', async () => {
    
    const mockServer: any = { use: vi.fn() };
    
    gateway.afterInit(mockServer);

   
    const middleware = mockServer.use.mock.calls[0][0];
    
    const mockSocket: any = { handshake: { auth: {} } };
    const mockNext = vi.fn();

    // Ejecutamos el middleware
    await middleware(mockSocket, mockNext);

    expect(mockNext).toHaveBeenCalledWith(new Error('unauthorized'));
  });

  it('debe autenticar al usuario y adjuntar sus datos si el token es válido', async () => {
    const mockServer: any = { use: vi.fn() };
    gateway.afterInit(mockServer);
    const middleware = mockServer.use.mock.calls[0][0];

    const mockSocket: any = {
      handshake: { auth: { token: 'valid-token' } },
      data: {},
    };
    const mockNext = vi.fn();

    vi.mocked(jwtService.verifyAsync).mockResolvedValue({ sub: 'user-123' } as any);
    vi.mocked(sessionService.getAuthenticatedUser).mockResolvedValue({ 
     id: 'user-123', 
     roles: ['titulado'] 
    } as any);

    await middleware(mockSocket, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    
    expect(mockSocket.data.user).toBeDefined();
    expect(mockSocket.data.user.id).toBe('user-123');
  });

  it('atiende message:send y conserva la difusión message:new de la epic', async () => {
    const client = { data: { user: { id: 'user-1' } } } as unknown as Socket;
    const message = {
      id: 'message-1', conversationId: 'conversation-1', senderId: 'user-1', content: 'Hola',
      timestamp: '2026-10-30T12:00:00Z', createdAt: '2026-10-30T12:00:00Z',
      status: 'sent' as const, isAttachment: false, attachmentType: null,
    };
    const emit = vi.fn();
    const to = vi.fn().mockReturnValue({ emit });
    gateway.server = { to } as unknown as Server;
    vi.mocked(messageService.send).mockResolvedValue(message);
    expect(Reflect.getMetadata('message', ChatGateway.prototype.sendMessage)).toBe('message:send');
    expect(await gateway.sendMessage(client, { conversationId: 'conversation-1', content: 'Hola' })).toEqual({ ok: true, message });
    expect(messageService.send).toHaveBeenCalledWith({ conversationId: 'conversation-1', senderId: 'user-1', content: 'Hola' });
    expect(to).toHaveBeenCalledWith('conversation-1');
    expect(emit).toHaveBeenCalledWith('message:new', message);
  });

  it('mantiene el rechazo del servicio cuando no se permite enviar', async () => {
    const client = { data: { user: { id: 'user-1' } } } as unknown as Socket;
    vi.mocked(messageService.send).mockRejectedValue(new Error('Usuario bloqueado'));
    expect(await gateway.sendMessage(client, { conversationId: 'conversation-1', content: 'Hola' })).toEqual({ ok: false, error: 'Usuario bloqueado' });
  });

  it('rechaza event_room:join cuando no hay una sesión autenticada', async () => {
    const client = {
      data: {},
      join: vi.fn(),
      emit: vi.fn(),
    } as unknown as Socket;

    const result = await gateway.handleEventRoomJoin(client, {
      registrationId: REGISTRATION_ID,
    });

    expect(eventRoomService.joinEventRoom).not.toHaveBeenCalled();
    expect(client.emit).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: 'Sesión no válida' });
  });

  it('atiende event_room:join con registrationId y emite la sala', async () => {
    const client = {
      data: { user: { id: 'user-1' } },
      join: vi.fn().mockResolvedValue(undefined),
      emit: vi.fn(),
    } as unknown as Socket;
    const room = {
      conversationId: 'conversation-1',
      eventId: 'event-1',
      name: 'Taller de React',
      createdAt: '2026-11-01T10:00:00.000Z',
      participants: [{ id: 'user-1', fullName: 'Usuario Uno' }],
    };
    vi.mocked(eventRoomService.joinEventRoom).mockResolvedValue(room);

    const result = await gateway.handleEventRoomJoin(client, {
      registrationId: REGISTRATION_ID,
    });

    expect(eventRoomService.joinEventRoom).toHaveBeenCalledWith(
      'user-1',
      REGISTRATION_ID,
    );
    expect(client.join).toHaveBeenCalledWith('conversation-1');
    expect(client.emit).toHaveBeenCalledWith('event_room:joined', room);
    expect(result).toEqual({ ok: true, conversationId: 'conversation-1' });
  });

  it('emite not_registered cuando la inscripción no es válida', async () => {
    const client = {
      data: { user: { id: 'user-1' } },
      join: vi.fn(),
      emit: vi.fn(),
    } as unknown as Socket;
    vi.mocked(eventRoomService.joinEventRoom).mockRejectedValue(
      new NotRegisteredForEventException(),
    );

    const result = await gateway.handleEventRoomJoin(client, {
      registrationId: REGISTRATION_ID,
    });

    expect(client.emit).toHaveBeenCalledWith('event_room:error', {
      code: 'not_registered',
    });
    expect(result.ok).toBe(false);
  });

  it('rechaza un registrationId que no es uuid', async () => {
    const client = {
      data: { user: { id: 'user-1' } },
      join: vi.fn(),
      emit: vi.fn(),
    } as unknown as Socket;

    const result = await gateway.handleEventRoomJoin(client, {
      registrationId: 'not-a-uuid',
    });

    expect(eventRoomService.joinEventRoom).not.toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith('event_room:error', {
      code: 'generic_error',
    });
    expect(result.ok).toBe(false);
  });
});