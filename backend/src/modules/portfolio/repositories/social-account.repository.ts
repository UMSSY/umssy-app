import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { SOCIAL_ACCOUNT_SELECT } from '../constants/social-account-select.constants.js';
import { SocialAccountAlreadyLinkedException } from '../exceptions/social-account-already-linked.exception.js';
import { SocialAccountNotFoundException } from '../exceptions/social-account-not-found.exception.js';
import { UnknownPortfolioProviderException } from '../exceptions/unknown-portfolio-provider.exception.js';
import type { PortfolioProvider } from '../types/portfolio-provider.type.js';
import type { SocialAccountEntity } from '../types/social-account-entity.type.js';
import type { SocialAccountRecord } from '../types/social-account-record.type.js';
import type { UpsertSocialAccountInput } from '../types/upsert-social-account.type.js';
import { parsePortfolioProvider } from '../utils/parse-portfolio-provider.util.js';

@Injectable()
export class SocialAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<SocialAccountEntity[]> {
    const rows = await this.prisma.userSocialAccount.findMany({
      where: { userId },
      select: SOCIAL_ACCOUNT_SELECT,
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
      select: SOCIAL_ACCOUNT_SELECT,
    });

    return this.toEntity(row);
  }

  async disconnect(userId: string, provider: PortfolioProvider): Promise<void> {
    const providerRecord = await this.prisma.portfolioProvider.findUnique({
      where: { name: provider },
      select: { id: true },
    });

    if (!providerRecord) {
      throw new UnknownPortfolioProviderException(provider);
    }

    const existing = await this.prisma.userSocialAccount.findUnique({
      where: {
        userId_providerId: {
          userId,
          providerId: providerRecord.id,
        },
      },
      select: { id: true },
    });

    if (!existing) {
      throw new SocialAccountNotFoundException();
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userPortfolioProject.deleteMany({
        where: {
          userId,
          providerId: providerRecord.id,
        },
      });

      await tx.userSocialAccount.delete({
        where: {
          userId_providerId: {
            userId,
            providerId: providerRecord.id,
          },
        },
      });

      const remaining = await tx.userPortfolioProject.findMany({
        where: { userId },
        orderBy: { displayOrder: 'asc' },
        select: { id: true },
      });

      for (let index = 0; index < remaining.length; index++) {
        await tx.userPortfolioProject.update({
          where: { id: remaining[index].id },
          data: { displayOrder: index },
        });
      }
    });
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
