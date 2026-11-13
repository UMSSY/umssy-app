import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

@Injectable()
export class NotificationUserLookupRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}

  async findEmailByUserId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    return user?.email ?? null;
  }

  async hasBlockBetween(actorId: string, recipientId: string): Promise<boolean> {
    const block = await this.prisma.chatUserBlock.findFirst({
      where: {
        OR: [
          { blockerId: actorId, blockedId: recipientId },
          { blockerId: recipientId, blockedId: actorId },
        ],
      },
      select: { id: true },
    });
    return block !== null;
  }
}