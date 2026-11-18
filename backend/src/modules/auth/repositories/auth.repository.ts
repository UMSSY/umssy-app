import { Injectable } from '@nestjs/common';
import { PasswordHistoryRepository } from './password-history.repository.js';
import { PasswordResetConflictException } from '../exceptions/password-reset-conflict.exception.js';
import { MAX_OTP_ATTEMPTS } from '../constants/password-reset.constants.js';
import { InvalidResetCodeException } from '../exceptions/invalid-reset-code.exception.js';
import { GoogleAccountAlreadyLinkedException } from '../exceptions/google-account-already-linked.exception.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

@Injectable()
export class AuthRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHistory: PasswordHistoryRepository,
  ) {}

  async existsByEmail(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    return user !== null;
  }

  findUserByEmailWithRoles(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
        isActive: true,
        roles: {
          where: { deletedAt: null, startAt: { lte: new Date() } },
          select: { role: { select: { name: true } } },
        },
      },
    });
  }

  findUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });
  }

  async findUserByGoogleSubWithRoles(googleSub: string) {
    const socialAccount = await this.prisma.userSocialAccount.findFirst({
      where: {
        externalId: googleSub,
        provider: { name: 'google' },
      },
      select: {
        user: {
          select: {
            id: true,
            password: true,
            isActive: true,
            roles: {
              where: { deletedAt: null, startAt: { lte: new Date() } },
              select: { role: { select: { name: true } } },
            },
          },
        },
      },
    });
    return socialAccount?.user ?? null;
  }

  async findGoogleSocialAccountBySub(googleSub: string) {
    return this.prisma.userSocialAccount.findFirst({
      where: {
        externalId: googleSub,
        provider: { name: 'google' },
      },
      select: {
        id: true,
        userId: true,
        externalId: true,
        username: true,
      },
    });
  }

  async linkGoogleAccount(
    userId: string,
    googleSub: string,
    googleEmail: string,
    profileUrl?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      let provider = await tx.portfolioProvider.findUnique({
        where: { name: 'google' },
      });
      if (!provider) {
        provider = await tx.portfolioProvider.create({
          data: {
            name: 'google',
            description: 'Google OAuth Account',
          },
        });
      }

      const existingLink = await tx.userSocialAccount.findFirst({
        where: {
          providerId: provider.id,
          externalId: googleSub,
        },
      });

      if (existingLink && existingLink.userId !== userId) {
        throw new GoogleAccountAlreadyLinkedException();
      }

      return tx.userSocialAccount.upsert({
        where: {
          userId_providerId: {
            userId,
            providerId: provider.id,
          },
        },
        create: {
          userId,
          providerId: provider.id,
          externalId: googleSub,
          username: googleEmail,
          profileUrl: profileUrl || null,
        },
        update: {
          externalId: googleSub,
          username: googleEmail,
          profileUrl: profileUrl || null,
        },
      });
    });
  }

  async createPasswordResetOtp(
    userId: string,
    codeHash: string,
    expiresAt: Date,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.passwordResetOtp.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: new Date() },
      });

      return transaction.passwordResetOtp.create({
        data: { userId, codeHash, expiresAt },
      });
    });
  }

  findLatestOtp(userId: string) {
    return this.prisma.passwordResetOtp.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findLatestValidOtp(userId: string) {
    return this.prisma.passwordResetOtp.findFirst({
      where: {
        userId,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  incrementOtpAttempts(otpId: string) {
    return this.prisma.passwordResetOtp.update({
      where: { id: otpId },
      data: { attempts: { increment: 1 } },
    });
  }

  markOtpUsed(otpId: string) {
    return this.prisma.passwordResetOtp.update({
      where: { id: otpId },
      data: { usedAt: new Date() },
    });
  }

  async updateUserPasswordAndInvalidateOtp(
    userId: string,
    newPasswordHash: string,
    otpId: string,
    expectedPasswordHash: string | null,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const now = new Date();
      const consumed = await transaction.passwordResetOtp.updateMany({
        where: {
          id: otpId,
          userId,
          usedAt: null,
          expiresAt: { gt: now },
          attempts: { lt: MAX_OTP_ATTEMPTS },
        },
        data: { usedAt: now },
      });

      if (consumed.count !== 1) {
        throw new InvalidResetCodeException();
      }

      // El hash observado actúa como versión frente a cambios concurrentes.
      const updated = await transaction.user.updateMany({
        where: { id: userId, password: expectedPasswordHash },
        data: { password: newPasswordHash },
      });
      if (updated.count !== 1) {
        throw new PasswordResetConflictException();
      }

      if (expectedPasswordHash !== null) {
        await this.passwordHistory.recordPreviousAndTrim(
          transaction,
          userId,
          expectedPasswordHash,
        );
      }

      return transaction.user.findUniqueOrThrow({ where: { id: userId } });
    }, { isolationLevel: 'ReadCommitted' });
  }
}
