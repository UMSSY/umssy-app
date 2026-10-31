import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { Prisma } from '../../../prisma/client.js';
import { OTP_MAX_ATTEMPTS } from '../constants/otp.constants.js';

const OTP_SELECT = {
  id: true,
  accessRequestId: true,
  codeHash: true,
  expiresAt: true,
  attempts: true,
  usedAt: true,
  createdAt: true,
} as const;

@Injectable()
export class ActivationOtpRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { accessRequestId: string; codeHash: string; expiresAt: Date }) {
    return this.prisma.activationOtp.create({ data, select: { id: true, expiresAt: true } });
  }

  findLatestByRequest(accessRequestId: string) {
    return this.prisma.activationOtp.findFirst({
      where: { accessRequestId },
      orderBy: { createdAt: 'desc' },
      select: OTP_SELECT,
    });
  }

  // Reserva un intento ANTES de comparar el código. La condición va dentro del propio UPDATE,
  // así que aunque lleguen muchas peticiones a la vez nunca se pasa de OTP_MAX_ATTEMPTS.
  async reserveAttempt(id: string, now: Date): Promise<{ attempts: number } | null> {
    try {
      return await this.prisma.activationOtp.update({
        where: { id, usedAt: null, expiresAt: { gt: now }, attempts: { lt: OTP_MAX_ATTEMPTS } },
        data: { attempts: { increment: 1 } },
        select: { attempts: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return null;
      throw error;
    }
  }

  async releaseAttempt(id: string): Promise<void> {
    await this.prisma.activationOtp.updateMany({
      where: { id, attempts: { gt: 0 } },
      data: { attempts: { decrement: 1 } },
    });
  }

  async invalidate(id: string, now: Date): Promise<void> {
    await this.prisma.activationOtp.update({ where: { id }, data: { expiresAt: now }, select: { id: true } });
  }

  async invalidateOthers(accessRequestId: string, keepId: string, now: Date): Promise<void> {
    await this.prisma.activationOtp.updateMany({
      where: { accessRequestId, id: { not: keepId }, usedAt: null, expiresAt: { gt: now } },
      data: { expiresAt: now },
    });
  }

  async countResendsSince(accessRequestId: string, since: Date): Promise<number> {
    const first = await this.prisma.activationOtp.findFirst({
      where: { accessRequestId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!first) return 0;
    return this.prisma.activationOtp.count({
      where: { accessRequestId, id: { not: first.id }, createdAt: { gte: since } },
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.activationOtp.delete({ where: { id }, select: { id: true } });
  }
}
