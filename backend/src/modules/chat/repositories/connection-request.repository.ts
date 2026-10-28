import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

@Injectable()
export class ConnectionRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findStatusByTitle(title: string) {
    return this.prisma.connectionRequestStatus.findUnique({
      where: { title },
    });
  }

  async findPendingRequest(senderId: string, receiverId: string) {
    return this.prisma.connectionRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
        status: { title: 'PENDING' },
      },
    });
  }

  async findAcceptedRequest(senderId: string, receiverId: string) {
    return this.prisma.connectionRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
        status: { title: 'ACCEPTED' },
      },
    });
  }

  async findSentByUser(senderId: string) {
    return this.prisma.connectionRequest.findMany({
      where: { senderId },
      include: { status: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findReceivedByUser(receiverId: string) {
    return this.prisma.connectionRequest.findMany({
      where: {
        receiverId,
        status: {
          title: 'PENDING',
        },
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        statusId: true,
        createdAt: true,
        updatedAt: true,
        status: {
          select: {
            id: true,
            title: true,
          },
        },
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            headline: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(requestId: string) {
    return this.prisma.connectionRequest.findUnique({
      where: { id: requestId },
      include: { status: true },
    });
  }

  async create(senderId: string, receiverId: string, statusId: string) {
    return this.prisma.connectionRequest.create({
      data: {
        senderId,
        receiverId,
        statusId,
      },
    });
  }

  async updatePendingStatus(requestId: string, statusId: string) {
    return this.prisma.connectionRequest.updateMany({
      where: {
        id: requestId,
        status: { title: 'PENDING' },
      },
      data: {
        statusId,
      },
    });
  }
}
