import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

@Injectable()
export class ChatUserBlockRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsers(blockerId: string, blockedId: string) {
    return this.prisma.chatUserBlock.findUnique({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
    });
  }

  async createBlock(blockerId: string, blockedId: string) {
    return this.prisma.chatUserBlock.create({
      data: { blockerId, blockedId },
    });
  }

  async removeBlock(blockerId: string, blockedId: string) {
    return this.prisma.chatUserBlock.delete({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
    });
  }

  async isBlockedBetween(userAId: string, userBId: string): Promise<boolean> {
    const block = await this.prisma.chatUserBlock.findFirst({
      where: {
        OR: [
          { blockerId: userAId, blockedId: userBId },
          { blockerId: userBId, blockedId: userAId },
        ],
      },
    });
    return !!block;
  }

  async findBlockedIdsBy(blockerId: string): Promise<string[]> {
    const rows = await this.prisma.chatUserBlock.findMany({
      where: { blockerId },
      select: { blockedId: true },
    });
    return rows.map((r) => r.blockedId);
  }
}