import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { Prisma } from '../../../prisma/client.js';
import { ACTIVATION_ROLE } from '../constants/activation.constants.js';
import { ACCESS_REQUEST_STATUS } from '../types/access-request.enum.js';

export interface NewActivatedUser {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  passwordHash: string;
}

@Injectable()
export class AccountActivationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findApprovedRequestByEmail(email: string) {
    return this.prisma.accessRequest.findFirst({
      where: { email, status: { title: ACCESS_REQUEST_STATUS.APPROVED } },
      orderBy: { reviewedAt: { sort: 'desc', nulls: 'last' } },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    });
  }

  async userExistsByEmail(email: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    return user !== null;
  }

  async createUserAndConsumeOtp(otpId: string, user: NewActivatedUser, now: Date): Promise<'created' | 'already_used'> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const consumed = await tx.activationOtp.updateMany({
          where: { id: otpId, usedAt: null },
          data: { usedAt: now },
        });
        if (consumed.count === 0) return 'already_used' as const;
        await tx.user.create({
          data: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            password: user.passwordHash,
            isActive: true,
            roles: { create: { role: { connect: { name: ACTIVATION_ROLE } } } },
          },
          select: { id: true },
        });
        return 'created' as const;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return 'already_used';
      }
      throw error;
    }
  }
}