
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectionRequestService } from '../services/connection-request.service.js';

describe('ConnectionRequestService', () => {
  const senderId = 'sender-id';
  const receiverId = 'receiver-id';
  const requestId = 'request-id';

  const repository = {
    findPendingRequest: vi.fn(),
    findAcceptedRequest: vi.fn(),
    findStatusByTitle: vi.fn(),
    findById: vi.fn(),
    updatePendingStatus: vi.fn(),
    create: vi.fn(),
    findSentByUser: vi.fn(),
    findReceivedByUser: vi.fn(),
    findAcceptedByUser: vi.fn(),
  };

  const blockRepository = {
    isBlockedBetween: vi.fn(),
  };

  const userRepository = {
    findActiveById: vi.fn(),
  };

  let service: ConnectionRequestService;

  beforeEach(() => {
    vi.resetAllMocks();

    service = new ConnectionRequestService(
      repository as any,
      blockRepository as any,
      userRepository as any,
    );

    userRepository.findActiveById.mockResolvedValue({
      id: receiverId,
    });

    blockRepository.isBlockedBetween.mockResolvedValue(false);

    repository.findPendingRequest.mockResolvedValue(null);
    repository.findAcceptedRequest.mockResolvedValue(null);

    repository.findStatusByTitle.mockImplementation(
      async (title: string) => ({
        id: `${title.toLowerCase()}-status-id`,
        title,
      }),
    );

    repository.create.mockResolvedValue({
      id: requestId,
      senderId,
      receiverId,
      statusId: 'pending-status-id',
    });

    repository.findById.mockResolvedValue({
      id: requestId,
      senderId,
      receiverId,
      status: { title: 'PENDING' },
    });

    repository.updatePendingStatus.mockResolvedValue({
      count: 1,
    });
  });

  it('envía una solicitud válida', async () => {
    const result = await service.send(senderId, receiverId);

    expect(result).toMatchObject({
      senderId,
      receiverId,
    });

    expect(repository.create).toHaveBeenCalledWith(
      senderId,
      receiverId,
      'pending-status-id',
    );
  });

  it('impide enviarse una solicitud a sí mismo', async () => {
    await expect(
      service.send(senderId, senderId),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('rechaza destinatarios inexistentes o inactivos', async () => {
    userRepository.findActiveById.mockResolvedValue(null);

    await expect(
      service.send(senderId, receiverId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('impide enviar solicitudes cuando existe un bloqueo', async () => {
    blockRepository.isBlockedBetween.mockResolvedValue(true);

    await expect(
      service.send(senderId, receiverId),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('impide solicitudes pendientes duplicadas', async () => {
    repository.findPendingRequest.mockResolvedValue({
      id: 'existing-request',
    });

    await expect(
      service.send(senderId, receiverId),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('impide solicitudes cuando ya existe una conexión aceptada', async () => {
    repository.findAcceptedRequest.mockResolvedValue({
      id: 'accepted-request',
    });

    await expect(
      service.send(senderId, receiverId),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('reporta cuando no existe el estado PENDING', async () => {
    repository.findStatusByTitle.mockResolvedValue(null);

    await expect(
      service.send(senderId, receiverId),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('consulta las solicitudes enviadas por el usuario', async () => {
    const requests = [{ id: 'request-1' }];
    repository.findSentByUser.mockResolvedValue(requests);

    await expect(service.findSent(senderId)).resolves.toEqual(requests);

    expect(repository.findSentByUser).toHaveBeenCalledWith(senderId);
  });

  it('consulta las solicitudes recibidas por el usuario', async () => {
    const requests = [{ id: 'request-2' }];
    repository.findReceivedByUser.mockResolvedValue(requests);

    await expect(service.findReceived(receiverId)).resolves.toEqual(requests);

    expect(repository.findReceivedByUser).toHaveBeenCalledWith(receiverId);
  });

  it('permite al destinatario aceptar una solicitud pendiente', async () => {
    const result = await service.accept(requestId, receiverId);

    expect(repository.findById).toHaveBeenCalledWith(requestId);

    expect(repository.findStatusByTitle).toHaveBeenCalledWith(
      'ACCEPTED',
    );

    expect(repository.updatePendingStatus).toHaveBeenCalledWith(
      requestId,
      'accepted-status-id',
    );

    expect(result).toBeDefined();
  });

  it('permite al destinatario rechazar una solicitud pendiente', async () => {
    const result = await service.reject(requestId, receiverId);

    expect(repository.findStatusByTitle).toHaveBeenCalledWith(
      'REJECTED',
    );

    expect(repository.updatePendingStatus).toHaveBeenCalledWith(
      requestId,
      'rejected-status-id',
    );

    expect(result).toBeDefined();
  });

  it('impide al remitente aceptar su propia solicitud enviada', async () => {
    await expect(
      service.accept(requestId, senderId),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(repository.updatePendingStatus).not.toHaveBeenCalled();
  });

  it('impide al remitente rechazar su propia solicitud enviada', async () => {
    await expect(
      service.reject(requestId, senderId),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(repository.updatePendingStatus).not.toHaveBeenCalled();
  });

  it('devuelve error cuando la solicitud no existe', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.accept(requestId, receiverId),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.updatePendingStatus).not.toHaveBeenCalled();
  });

  it('impide aceptar una solicitud ya procesada', async () => {
    repository.findById.mockResolvedValue({
      id: requestId,
      senderId,
      receiverId,
      status: { title: 'ACCEPTED' },
    });

    await expect(
      service.accept(requestId, receiverId),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.updatePendingStatus).not.toHaveBeenCalled();
  });

  it('impide rechazar una solicitud ya procesada', async () => {
    repository.findById.mockResolvedValue({
      id: requestId,
      senderId,
      receiverId,
      status: { title: 'REJECTED' },
    });

    await expect(
      service.reject(requestId, receiverId),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.updatePendingStatus).not.toHaveBeenCalled();
  });

  it('reporta cuando no existe el estado ACCEPTED', async () => {
    repository.findStatusByTitle.mockResolvedValue(null);

    await expect(
      service.accept(requestId, receiverId),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('reporta cuando no existe el estado REJECTED', async () => {
    repository.findStatusByTitle.mockResolvedValue(null);

    await expect(
      service.reject(requestId, receiverId),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('impide procesar una solicitud modificada concurrentemente', async () => {
    repository.updatePendingStatus.mockResolvedValue({
      count: 0,
    });

    await expect(
      service.accept(requestId, receiverId),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('consulta las conexiones aceptadas del usuario', async () => {
  const acceptedConnections = [
    {
      id: 'accepted-request-1',
      senderId,
      receiverId,
      status: { title: 'ACCEPTED' },
    },
    {
      id: 'accepted-request-2',
      senderId: receiverId,
      receiverId: senderId,
      status: { title: 'ACCEPTED' },
    },
  ];

  repository.findAcceptedByUser.mockResolvedValue(acceptedConnections);

  const result = await service.findAccepted(senderId);

  expect(repository.findAcceptedByUser).toHaveBeenCalledWith(senderId);
  expect(result).toEqual(acceptedConnections);
});
});
