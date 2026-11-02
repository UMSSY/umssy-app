import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Prisma } from '../../../prisma/client.js';
import { CATALOG_STATUS_TITLES } from '../constants/events.constants.js';

@Injectable()
export class EventProposalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(operation);
  }

  findByKey(userId: string, key: string) {
    return this.prisma.event.findUnique({ where: { createdById_proposalKey: { createdById: userId, proposalKey: key } } });
  }

  findAuthor(tx: Prisma.TransactionClient, userId: string) {
    return tx.user.findFirst({ where: { id: userId, isActive: true, roles: { some: { deletedAt: null, role: { name: 'titulado' } } } }, select: { firstName: true, lastName: true } });
  }

  findCategory(tx: Prisma.TransactionClient, categoryId: string) {
    return tx.eventCategory.findUnique({ where: { id: categoryId }, select: { id: true } });
  }

  async ensureCatalogs(tx: Prisma.TransactionClient, modalityTitle: string) {
    const status = await tx.eventStatus.upsert({ where: { title: 'En votación' }, update: {}, create: { title: 'En votación' } });
    const origin = await tx.eventOrigin.upsert({ where: { title: 'Comunidad' }, update: {}, create: { title: 'Comunidad' } });
    const modality = await tx.eventModality.upsert({ where: { title: modalityTitle }, update: {}, create: { title: modalityTitle } });
    return { statusId: status.id, originId: origin.id, modalityId: modality.id };
  }

  create(tx: Prisma.TransactionClient, data: Prisma.EventUncheckedCreateInput) {
    return tx.event.create({ data });
  }

  findCover(id: string) {
    return this.prisma.event.findFirst({ where: { id, status: { title: { in: CATALOG_STATUS_TITLES } } }, select: { coverData: true, coverMimeType: true } });
  }
}
