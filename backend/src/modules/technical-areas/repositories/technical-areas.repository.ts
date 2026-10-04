import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TechnicalAreaRecord } from '../types/technical-area.type.js';

@Injectable()
export class TechnicalAreasRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<TechnicalAreaRecord[]> {
    return this.prisma.technicalArea.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });
  }
}