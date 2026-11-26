import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';
import { NotificationGateway } from '../gateways/notification.gateway.js';
import { SessionService } from '../../../common/services/session.service.js';
import { AppVisibilityService } from '../services/app-visibility.service.js';

interface MockServer {
  use: ReturnType<typeof vi.fn>;
  to: ReturnType<typeof vi.fn>;
  emit: ReturnType<typeof vi.fn>;
}

interface MockJwtService {
  verifyAsync: ReturnType<typeof vi.fn>;
}

interface MockSessionService {
  getAuthenticatedUser: ReturnType<typeof vi.fn>;
}

interface MockAppVisibilityService {
  setVisibility: ReturnType<typeof vi.fn>;
  removeConnection: ReturnType<typeof vi.fn>;
}

function createClient(): Socket {
  return { id: 'socket-1', data: { user: { id: 'user-123' } } } as unknown as Socket;
}

describe('NotificationGateway', () => {
  let gateway: NotificationGateway;
  let mockServer: MockServer;
  let mockJwtService: MockJwtService;
  let mockSessionService: MockSessionService;
  let mockAppVisibilityService: MockAppVisibilityService;

  beforeEach(async () => {
    mockServer = {
      use: vi.fn(),
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };

    mockJwtService = { verifyAsync: vi.fn() };
    mockSessionService = { getAuthenticatedUser: vi.fn() };
    mockAppVisibilityService = { setVisibility: vi.fn(), removeConnection: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationGateway,
        { provide: JwtService, useValue: mockJwtService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: AppVisibilityService, useValue: mockAppVisibilityService },
      ],
    }).compile();

    gateway = module.get<NotificationGateway>(NotificationGateway);
    gateway.server = mockServer as unknown as NotificationGateway['server'];
  });

  it('debe emitir el evento a la sala privada del usuario', () => {
    gateway.emitToUser('user-123', 'notification:new', { title: 'Test' });

    expect(mockServer.to).toHaveBeenCalledWith('user:user-123');
    expect(mockServer.emit).toHaveBeenCalledWith('notification:new', { title: 'Test' });
  });

  it('debe configurar el middleware de autenticación en afterInit', () => {
    gateway.afterInit(mockServer as unknown as NotificationGateway['server']);
    expect(mockServer.use).toHaveBeenCalledTimes(1);
  });

  it('autentica el socket desde la cookie umssy_access cuando no se envía token en auth', async () => {
    gateway.afterInit(mockServer as unknown as NotificationGateway['server']);
    const middleware = mockServer.use.mock.calls[0][0] as (
      socket: Record<string, unknown>,
      next: (err?: Error) => void,
    ) => Promise<void>;

    const mockSocket = {
      handshake: {
        auth: {},
        headers: { cookie: 'umssy_access=cookie-notif-jwt' },
      },
      data: {} as Record<string, unknown>,
    };
    const mockNext = vi.fn();
    mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-notif-1' });
    mockSessionService.getAuthenticatedUser.mockResolvedValue({
      id: 'user-notif-1',
      roles: ['titulado'],
    });

    await middleware(mockSocket, mockNext);

    expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('cookie-notif-jwt');
    expect(mockNext).toHaveBeenCalledWith();
    expect(mockSocket.data.user).toEqual({
      id: 'user-notif-1',
      roles: ['titulado'],
    });
  });

  it('registra la visibilidad reportada por el cliente', () => {
    gateway.handleVisibilityChanged(createClient(), { visible: true });

    expect(mockAppVisibilityService.setVisibility).toHaveBeenCalledWith('user-123', 'socket-1', true);
  });

  it('ignora un payload de visibilidad inválido', () => {
    gateway.handleVisibilityChanged(createClient(), { visible: 'yes' });

    expect(mockAppVisibilityService.setVisibility).not.toHaveBeenCalled();
  });

  it('limpia la visibilidad al desconectarse el cliente', () => {
    gateway.handleDisconnect(createClient());

    expect(mockAppVisibilityService.removeConnection).toHaveBeenCalledWith('user-123', 'socket-1');
  });
});
