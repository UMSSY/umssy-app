import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Prisma } from '../../../prisma/client.js';
import { SocialAccountAlreadyLinkedException } from '../exceptions/social-account-already-linked.exception.js';
import { UnknownPortfolioProviderException } from '../exceptions/unknown-portfolio-provider.exception.js';
import type { SocialAccountEntity } from '../types/social-account-entity.type.js';
import type { UpsertSocialAccountInput } from '../types/upsert-social-account.type.js';
import { parsePortfolioProvider } from '../utils/parse-portfolio-provider.util.js';

const socialAccountSelect = {
  id: true,
  userId: true,
  externalId: true,
  username: true,
  profileUrl: true,
  createdAt: true,
  updatedAt: true,
  provider: {
    select: {
      name: true,
    },
  },
} as const;

type SocialAccountRecord = Prisma.UserSocialAccountGetPayload<{
  select: typeof socialAccountSelect;
}>;

@Injectable()
export class SocialAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<SocialAccountEntity[]> {
    const rows = await this.prisma.userSocialAccount.findMany({
      where: { userId },
      select: socialAccountSelect,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async upsertAccount(
    data: UpsertSocialAccountInput,
  ): Promise<SocialAccountEntity> {
    const providerRecord = await this.prisma.portfolioProvider.findUnique({
      where: { name: data.provider },
      select: { id: true },
    });

    if (!providerRecord) {
      throw new UnknownPortfolioProviderException(data.provider);
    }

    const existingAccount = await this.prisma.userSocialAccount.findFirst({
      where: {
        providerId: providerRecord.id,
        externalId: data.externalId,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (existingAccount && existingAccount.userId !== data.userId) {
      throw new SocialAccountAlreadyLinkedException();
    }

    const normalizedUsername = (data.username ?? '').trim();
    const normalizedProfileUrl = data.profileUrl
      ? (data.profileUrl ?? '').trim()
      : null;

    const row = await this.prisma.userSocialAccount.upsert({
      where: {
        userId_providerId: {
          userId: data.userId,
          providerId: providerRecord.id,
        },
      },
      create: {
        userId: data.userId,
        providerId: providerRecord.id,
        externalId: data.externalId,
        username: normalizedUsername,
        profileUrl: normalizedProfileUrl,
      },
      update: {
        externalId: data.externalId,
        username: normalizedUsername,
        profileUrl: normalizedProfileUrl,
      },
      select: socialAccountSelect,
    });

    return this.toEntity(row);
  }

  private toEntity(row: SocialAccountRecord): SocialAccountEntity {
    return {
      id: row.id,
      userId: row.userId,
      provider: parsePortfolioProvider(row.provider.name),
      externalId: row.externalId,
      username: row.username,
      profileUrl: row.profileUrl,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

