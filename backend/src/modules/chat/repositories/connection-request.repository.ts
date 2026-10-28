
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
        senderId,
        receiverId,
        status: { title: 'PENDING' },
      },
    });
  }

  async create(senderId: string, receiverId: string, statusId: string) {
    return this.prisma.connectionRequest.create({
      data: { senderId, receiverId, statusId },
    });
  }

  async updateStatus(requestId: string, statusId: string) {
    return this.prisma.connectionRequest.update({
      where: { id: requestId },
      data: { statusId },
    });
  }
}