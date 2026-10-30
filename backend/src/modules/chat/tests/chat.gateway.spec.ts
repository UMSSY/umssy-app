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

describe('ChatGateway (HU-5 Handshake)', () => {
  let gateway: ChatGateway;
  let jwtService: JwtService;
  let sessionService: SessionService;
  let messageService: MessageService;

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
});