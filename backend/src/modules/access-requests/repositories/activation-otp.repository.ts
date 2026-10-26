import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

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

  // Solo se guarda el hash del código, nunca el texto plano
  create(data: { accessRequestId: string; codeHash: string; expiresAt: Date }) {
    return this.prisma.activationOtp.create({ data, select: { id: true, expiresAt: true } });
  }

  // El código vigente es siempre el último que se generó
  findLatestByRequest(accessRequestId: string) {
    return this.prisma.activationOtp.findFirst({
      where: { accessRequestId },
      orderBy: { createdAt: 'desc' },
      select: OTP_SELECT,
    });
  }

  incrementAttempts(id: string) {
    return this.prisma.activationOtp.update({
      where: { id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });
  }

  // Invalidar = adelantar el vencimiento a "ahora"
  async invalidate(id: string, now: Date): Promise<void> {
    await this.prisma.activationOtp.update({ where: { id }, data: { expiresAt: now }, select: { id: true } });
  }

  // Al emitir un código nuevo, los anteriores sin usar dejan de servir
  async invalidateOthers(accessRequestId: string, keepId: string, now: Date): Promise<void> {
    await this.prisma.activationOtp.updateMany({
      where: { accessRequestId, id: { not: keepId }, usedAt: null, expiresAt: { gt: now } },
      data: { expiresAt: now },
    });
  }

  // El primer código lo envía la aprobación; solo los siguientes son reenvíos
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

  // Si el correo no sale, el código recién creado se descarta para que no cuente como reenvío
  async remove(id: string): Promise<void> {
    await this.prisma.activationOtp.delete({ where: { id }, select: { id: true } });
  }
}