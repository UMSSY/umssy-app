import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

@Injectable()
export class VacanciesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActive(page: number, limit: number) {
    return this.prisma.vacancy.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findActiveById(id: string) {
    return this.prisma.vacancy.findFirst({
      where: {
        id,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
  }
}
