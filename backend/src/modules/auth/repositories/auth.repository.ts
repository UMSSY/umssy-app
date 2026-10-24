import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  async createPasswordResetOtp(userId: string, codeHash: string, expiresAt: Date) {
    // Invalida códigos anteriores no usados
    await this.prisma.passwordResetOtp.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    return this.prisma.passwordResetOtp.create({
      data: {
        userId,
        codeHash,
        expiresAt,
      },
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

  async updateUserPasswordAndInvalidateOtp(userId: string, newPasswordHash: string, otpId: string) {
    return this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { password: newPasswordHash },
      }),
      this.prisma.passwordResetOtp.update({
        where: { id: otpId },
        data: { usedAt: new Date() },
      }),
    ]);
  }
}
