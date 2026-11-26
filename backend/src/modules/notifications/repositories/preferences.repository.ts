import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

@Injectable()
export class PreferencesRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}

  async findManyByUserIds(userIds: string[]) {
    return this.prisma.notificationPreference.findMany({
      where: { userId: { in: userIds } },
    });
  }

  async upsert(
    userId: string,
    data: { pushEnabled: boolean; emailEnabled: boolean; inAppEnabled: boolean },
  ): Promise<void> {
    await this.prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }
}