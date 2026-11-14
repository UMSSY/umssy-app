import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { NotificationGateway } from '../gateways/notification.gateway.js';
import { SessionService } from '../../../common/services/session.service.js';

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

describe('NotificationGateway', () => {
  let gateway: NotificationGateway;
  let mockServer: MockServer;
  let mockJwtService: MockJwtService;
  let mockSessionService: MockSessionService;

  beforeEach(async () => {
    mockServer = {
      use: vi.fn(),
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };

    mockJwtService = { verifyAsync: vi.fn() };
    mockSessionService = { getAuthenticatedUser: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationGateway,
        { provide: JwtService, useValue: mockJwtService },
        { provide: SessionService, useValue: mockSessionService },
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
});