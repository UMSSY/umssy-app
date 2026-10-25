
import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Prisma } from '../../../prisma/client.js';
import { PUBLISHED_STATUS_TITLE } from '../../events/constants/events.constants.js';
import { CONFIRMED_REGISTRATION_TITLE } from '../constants/event-registrations.constants.js';
import type { PersistEventRegistrationPayload } from '../types/event-registrations.types.js';
import type { EventSupportContext } from '../types/event-support-context.types.js';
import type { SupportTransactionResult } from '../types/support-transaction-result.types.js';

@Injectable()
export class EventRegistrationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(payload: PersistEventRegistrationPayload) {
    return this.prisma.eventRegistration.create({
      data: payload,
      select: {
        id: true,
        eventId: true,
        userId: true,
        statusId: true,
        qrToken: true,
      },
    });
  }

  findByUserId(userId: string) {
    return this.prisma.eventRegistration.findMany({
      where: {
        userId,
        cancelledAt: null,
        status: { title: CONFIRMED_REGISTRATION_TITLE },
        event: { status: { title: PUBLISHED_STATUS_TITLE } },
      },
      select: {
        id: true,
        status: { select: { title: true } },
        event: {
          select: {
            title: true,
            eventDate: true,
            startTime: true,
            endTime: true,
            location: true,
          },
        },
      },
      orderBy: { event: { eventDate: 'asc' } },
    });
  }

  async registerSupport(
    eventId: string,
    userId: string,
    assertSupportable: (event: EventSupportContext) => void,
  ): Promise<SupportTransactionResult | null> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM events WHERE id = ${eventId}::uuid FOR UPDATE`;

      const event = await this.loadSupportContext(tx, eventId);
      if (!event) return null;

      assertSupportable(event);

      const existing = await tx.eventRegistration.findUnique({
        where: { eventId_userId: { eventId, userId } },
        select: { id: true },
      });
      if (existing) {
        return {
          created: false,
          supportCount: event.supportCount,
          supportThreshold: event.supportThreshold,
          published: false,
        };
      }

      await tx.eventRegistration.create({
        data: {
          event: { connect: { id: eventId } },
          user: { connect: { id: userId } },
          status: { connect: { title: CONFIRMED_REGISTRATION_TITLE } },
          qrToken: randomBytes(32).toString('hex'),
        },
        select: { id: true },
      });

      const supportCount = event.supportCount + 1;
      const threshold = event.supportThreshold;
      const published =
        threshold !== null && threshold > 0 && supportCount >= threshold;

      if (published) {
        await tx.event.update({
          where: { id: eventId },
          data: { status: { connect: { title: PUBLISHED_STATUS_TITLE } } },
          select: { id: true },
        });
      }

      return {
        created: true,
        supportCount,
        supportThreshold: threshold,
        published,
      };
    });
  }

  private async loadSupportContext(
    tx: Prisma.TransactionClient,
    eventId: string,
  ): Promise<EventSupportContext | null> {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        votingDeadline: true,
        supportThreshold: true,
        status: { select: { title: true } },
        origin: { select: { title: true } },
        _count: {
          select: {
            registrations: {
              where: {
                cancelledAt: null,
                status: { title: CONFIRMED_REGISTRATION_TITLE },
              },
            },
          },
        },
      },
    });

    if (!event) return null;

    return {
      id: event.id,
      statusTitle: event.status.title,
      originTitle: event.origin.title,
      votingDeadline: event.votingDeadline,
      supportThreshold: event.supportThreshold,
      supportCount: event._count.registrations,
    };
  }
}