import { describe, expect, it, vi } from 'vitest';
import { NotificationGateway } from '../gateways/notification.gateway.js';
import { SessionRevokedException } from '../../../common/exceptions/session-revoked.exception.js';

const SESSION_ID = '22222222-2222-4222-8222-222222222222';

function build(payload: Record<string, unknown>, revoked = false) {
  const jwtService = { verifyAsync: vi.fn().mockResolvedValue(payload) };
  const sessionService = {
    assertSessionActive: vi.fn().mockImplementation(() => (revoked ? Promise.reject(new SessionRevokedException()) : Promise.resolve())),
    getAuthenticatedUser: vi.fn().mockResolvedValue({ id: 'user-1', roles: ['titulado'] }),
  };
  const gateway = new NotificationGateway(jwtService as never, sessionService as never, {} as never);
  const server = { use: vi.fn() };
  gateway.afterInit(server as never);
  const middleware = server.use.mock.calls[0][0] as (socket: unknown, next: (error?: Error) => void) => Promise<void>;
  const socket = { handshake: { auth: {}, headers: { cookie: 'umssy_access=signed.jwt' } }, data: {} as Record<string, unknown> };
  return { middleware, socket, sessionService };
}

describe('NotificationGateway: sesiones revocadas en el handshake', () => {
  it('rechaza el socket con la cookie de una sesión revocada', async () => {
    const { middleware, socket, sessionService } = build({ sub: 'user-1', sid: SESSION_ID }, true);
    const next = vi.fn();

    await middleware(socket, next);

    expect(sessionService.assertSessionActive).toHaveBeenCalledWith(SESSION_ID);
    expect(next).toHaveBeenCalledWith(new Error('unauthorized'));
    expect(sessionService.getAuthenticatedUser).not.toHaveBeenCalled();
  });

  it('acepta el socket con una sesión vigente', async () => {
    const { middleware, socket } = build({ sub: 'user-1', sid: SESSION_ID });
    const next = vi.fn();

    await middleware(socket, next);

    expect(next).toHaveBeenCalledWith();
    expect(socket.data.user).toMatchObject({ id: 'user-1' });
  });

  it('acepta un token emitido antes del cambio (sin sid) sin comprobar la familia', async () => {
    const { middleware, socket, sessionService } = build({ sub: 'user-1' });
    const next = vi.fn();

    await middleware(socket, next);

    expect(sessionService.assertSessionActive).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });
});
