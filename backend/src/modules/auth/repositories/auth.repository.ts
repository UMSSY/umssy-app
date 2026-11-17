import { Injectable } from '@nestjs/common';
import { PasswordHistoryRepository } from './password-history.repository.js';
import { PasswordResetConflictException } from '../exceptions/password-reset-conflict.exception.js';
import { MAX_OTP_ATTEMPTS } from '../constants/password-reset.constants.js';
import { InvalidResetCodeException } from '../exceptions/invalid-reset-code.exception.js';
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
