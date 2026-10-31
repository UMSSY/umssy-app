import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChatGateway } from '../gateways/chat.gateway.js';
import { SessionService } from '../../../common/services/session.service.js';
import { ChatService } from '../services/chat.service.js';
import { UserPresenceService } from '../services/user-presence.service.js';
import { MessageService } from '../services/message.service.js';
import { EventRoomService } from '../services/event-room.service.js';

describe('ChatGateway (HU-5 Handshake)', () => {
  let gateway: ChatGateway;
  let jwtService: JwtService;
  let sessionService: SessionService;

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
          useValue: {},
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
});