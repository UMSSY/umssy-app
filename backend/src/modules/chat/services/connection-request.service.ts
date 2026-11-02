
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { ConnectionRequestRepository } from '../repositories/connection-request.repository.js';
import { ChatUserBlockRepository } from '../repositories/chat-user-block.repository.js';
import { UserLookupRepository } from '../repositories/user-lookup.repository.js';

@Injectable()
export class ConnectionRequestService {
  constructor(
    private readonly connectionRequestRepository: ConnectionRequestRepository,
    private readonly chatUserBlockRepository: ChatUserBlockRepository,
    private readonly userLookupRepository: UserLookupRepository,
  ) {}

  async send(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new BadRequestException(
        'No puedes enviarte una solicitud de conexión a ti mismo.',
      );
    }

    const receiver = await this.userLookupRepository.findActiveById(
      receiverId,
    );

    if (!receiver) {
      throw new NotFoundException(
        'El usuario destinatario no existe o está inactivo.',
      );
    }

    const isBlocked = await this.chatUserBlockRepository.isBlockedBetween(
      senderId,
      receiverId,
    );

    if (isBlocked) {
      throw new ConflictException(
        'No es posible enviar una solicitud de conexión a este usuario.',
      );
    }

    const pendingRequest =
      await this.connectionRequestRepository.findPendingRequest(
        senderId,
        receiverId,
      );

    if (pendingRequest) {
      throw new ConflictException(
        'Ya existe una solicitud de conexión pendiente entre estos usuarios.',
      );
    }

    const acceptedRequest =
      await this.connectionRequestRepository.findAcceptedRequest(
        senderId,
        receiverId,
      );

    if (acceptedRequest) {
      throw new ConflictException(
        'Ya existe una conexión aceptada entre estos usuarios.',
      );
    }

    const pendingStatus =
      await this.connectionRequestRepository.findStatusByTitle('PENDING');

    if (!pendingStatus) {
      throw new InternalServerErrorException(
        'El estado de solicitud pendiente no está configurado.',
      );
    }

    return this.connectionRequestRepository.create(
      senderId,
      receiverId,
      pendingStatus.id,
    );
  }

  async findSent(userId: string) {
    return this.connectionRequestRepository.findSentByUser(userId);
  }

  async findReceived(userId: string) {
    return this.connectionRequestRepository.findReceivedByUser(userId);
  }

async accept(requestId: string, currentUserId: string) {
  return this.respond(requestId, currentUserId, 'ACCEPTED');
}

async reject(requestId: string, currentUserId: string) {
  return this.respond(requestId, currentUserId, 'REJECTED');
}

async findAccepted(userId: string) {
  return this.connectionRequestRepository.findAcceptedByUser(userId);
}

private async respond(
  requestId: string,
  currentUserId: string,
  statusTitle: 'ACCEPTED' | 'REJECTED',
) {
  const request =
    await this.connectionRequestRepository.findById(requestId);

  if (!request) {
    throw new NotFoundException(
      'La solicitud de conexión no existe.',
    );
  }

  if (request.receiverId !== currentUserId) {
    throw new ForbiddenException(
      'No tienes permiso para responder esta solicitud.',
    );
  }

  if (request.status.title !== 'PENDING') {
    throw new ConflictException(
      'La solicitud de conexión ya fue procesada.',
    );
  }

  const status =
    await this.connectionRequestRepository.findStatusByTitle(
      statusTitle,
    );

  if (!status) {
    throw new InternalServerErrorException(
      'El estado de solicitud no está configurado.',
    );
  }

  const result =
    await this.connectionRequestRepository.updatePendingStatus(
      requestId,
      status.id,
    );

  if (result.count === 0) {
    throw new ConflictException(
      'La solicitud de conexión ya fue procesada.',
    );
  }

  return this.connectionRequestRepository.findById(requestId);
}

}
