
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectionRequestController } from '../controllers/connection-request.controller.js';
import type { ConnectionRequestService } from '../services/connection-request.service.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';

describe('ConnectionRequestController', () => {
  const user = {
    id: 'authenticated-user-id',
  } as AuthenticatedUser;

  const service = {
    send: vi.fn(),
    findSent: vi.fn(),
    findReceived: vi.fn(),
    findAccepted: vi.fn(),
    accept: vi.fn(),
    reject: vi.fn(),
  };

  const controller = new ConnectionRequestController(
    service as unknown as ConnectionRequestService,
  );

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('envía una solicitud utilizando el usuario autenticado', async () => {
    const request = { id: 'request-id' };

    service.send.mockResolvedValueOnce(request);

    const result = await controller.send(user, {
      receiverId: 'receiver-id',
    });

    expect(service.send).toHaveBeenCalledWith(
      user.id,
      'receiver-id',
    );

    expect(result).toEqual(request);
  });

  it('consulta las solicitudes enviadas del usuario autenticado', async () => {
    const requests = [{ id: 'request-1' }];

    service.findSent.mockResolvedValueOnce(requests);

    const result = await controller.findSent(user);

    expect(service.findSent).toHaveBeenCalledWith(user.id);
    expect(result).toEqual(requests);
  });

  it('consulta las solicitudes recibidas del usuario autenticado', async () => {
    const requests = [{ id: 'request-2' }];

    service.findReceived.mockResolvedValueOnce(requests);

    const result = await controller.findReceived(user);

    expect(service.findReceived).toHaveBeenCalledWith(user.id);
    expect(result).toEqual(requests);
  });

  it('consulta las conexiones aceptadas del usuario autenticado', async () => {
    const acceptedConnections = [
      {
        id: 'accepted-request-1',
        senderId: user.id,
        receiverId: 'other-user-id',
        status: { title: 'ACCEPTED' },
      },
    ];

    service.findAccepted.mockResolvedValueOnce(acceptedConnections);

    const result = await controller.findAccepted(user);

    expect(service.findAccepted).toHaveBeenCalledWith(user.id);
    expect(result).toEqual(acceptedConnections);
  });

  it('acepta una solicitud utilizando el usuario autenticado', async () => {
    const requestId = 'request-id';

    const response = {
      id: requestId,
      status: { title: 'ACCEPTED' },
    };

    service.accept.mockResolvedValueOnce(response);

    const result = await controller.accept(user, requestId);

    expect(service.accept).toHaveBeenCalledWith(
      requestId,
      user.id,
    );

    expect(result).toEqual(response);
  });

  it('rechaza una solicitud utilizando el usuario autenticado', async () => {
    const requestId = 'request-id';

    const response = {
      id: requestId,
      status: { title: 'REJECTED' },
    };

    service.reject.mockResolvedValueOnce(response);

    const result = await controller.reject(user, requestId);

    expect(service.reject).toHaveBeenCalledWith(
      requestId,
      user.id,
    );

    expect(result).toEqual(response);
  });
});
