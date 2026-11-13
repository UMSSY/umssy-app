import { Test, TestingModule } from '@nestjs/testing';
import { NotificationGateway } from '../gateways/notification.gateway.js';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from '../../../common/services/session.service.js';

describe('NotificationGateway', () => {
  let gateway: NotificationGateway;
  let mockServer: any;
  let mockJwtService: any;
  let mockSessionService: any;

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
    gateway.server = mockServer;
  });

  it('debe emitir el evento a la sala privada del usuario', () => {
    gateway.emitToUser('user-123', 'notification:new', { title: 'Test' });

    expect(mockServer.to).toHaveBeenCalledWith('user:user-123');
    expect(mockServer.emit).toHaveBeenCalledWith('notification:new', { title: 'Test' });
  });

  it('debe configurar el middleware de autenticación en afterInit', () => {
    gateway.afterInit(mockServer);
    expect(mockServer.use).toHaveBeenCalledTimes(1);
  });
});