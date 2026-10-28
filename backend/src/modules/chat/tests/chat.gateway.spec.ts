import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ChatGateway } from '../gateways/chat.gateway.js';
import { SessionService } from '../../../common/services/session.service.js';
import { ChatService } from '../services/chat.service.js';
import { UserPresenceService } from '../services/user-presence.service.js';
import { MessageService } from '../services/message.service.js';

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
    // Simulamos el servidor de Socket.io
    const mockServer: any = { use: vi.fn() };

    // Ejecutamos el hook afterInit
    gateway.afterInit(mockServer);

    // Extraemos la función middleware que se registró con server.use()
    const middleware = mockServer.use.mock.calls[0][0];

    // Simulamos un socket sin token
    const mockSocket: any = { handshake: { auth: {} } };
    const mockNext = vi.fn();

    // Ejecutamos el middleware
    await middleware(mockSocket, mockNext);

    // Verificamos que se rechace con 'unauthorized'
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

    // Simulamos que el JWT es válido y el usuario existe en la BD
    vi.mocked(jwtService.verifyAsync).mockResolvedValue({ sub: 'user-123' });
    vi.mocked(sessionService.getAuthenticatedUser).mockResolvedValue({
      id: 'user-123',
      roles: ['titulado'],
    } as any);

    await middleware(mockSocket, mockNext);

    // Verificamos que se le dio paso (next sin argumentos)
    expect(mockNext).toHaveBeenCalledWith();

    // Verificamos que el usuario se guardó en el socket
    expect(mockSocket.data.user).toBeDefined();
    expect(mockSocket.data.user.id).toBe('user-123');
  });
});