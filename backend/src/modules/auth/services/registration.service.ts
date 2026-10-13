import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { RegisterDto } from '../requests/register.schema.js';

@Injectable()
export class RegistrationService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const password = await bcrypt.hash(dto.password, 10);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.user.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
          select: { id: true },
        });
        if (existing) throw new ConflictException('Ya existe una cuenta con este correo.');
        const role = await tx.role.upsert({
          where: { name: dto.roleTag },
          update: {},
          create: { name: dto.roleTag },
        });
        const user = await tx.user.create({
          data: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            email,
            password,
            roles: { create: { roleId: role.id } },
          },
          select: { id: true, email: true },
        });
        return { ...user, roleTag: dto.roleTag };
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('Ya existe una cuenta con este correo.');
      }
      throw error;
    }
  }
}
