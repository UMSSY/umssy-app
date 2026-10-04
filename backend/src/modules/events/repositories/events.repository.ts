import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Prisma } from '../../../prisma/client.js';
import type {
  FindEventsPayload,
  FindEventsResponse,
  EventWithRelations,
} from '../types/events.types.js';

@Injectable()
export class EventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAndCount(payload: FindEventsPayload): Promise<FindEventsResponse> {
    const { categoryId, statusId, search, skip, take } = payload;

    const where: Prisma.EventWhereInput = {
      ...(categoryId !== undefined && { categoryId }),
      ...(statusId !== undefined && { statusId }),
      ...(search !== undefined && {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      }),
    };

    const select = {
      id: true,
      title: true,
      description: true,
      eventDate: true,
      startTime: true,
      endTime: true,
      location: true,
      capacity: true,
      statusId: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          registrations: {
            where: { cancelledAt: null },
          },
        },
      },
    } as const;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        select,
        where,
        orderBy: [{ eventDate: 'asc' }, { startTime: 'asc' }],
        skip,
        take,
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      items: items as unknown as EventWithRelations[],
      total,
    };
  }
}
