import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Prisma } from '../../../prisma/client.js';
import { REGISTRATION_STATUS_TITLES } from '../../../common/constants/registration-status.constants.js';
import { PUBLISHED_STATUS_TITLE } from '../../events/constants/events.constants.js';
import { REGISTRATION_SELECT } from '../constants/registrations.constants.js';
import type { CreateEventRegistrationPayload } from '../types/event-registrations.types.js';
import type { EventSupportContext } from '../types/event-support-context.types.js';
import { mapSupportContext } from '../mappers/support-context.mapper.js';

@Injectable()
export class EventRegistrationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>, isolationLevel?: Prisma.TransactionIsolationLevel): Promise<T> {
    return isolationLevel === undefined
      ? this.prisma.$transaction(operation)
      : this.prisma.$transaction(operation, { isolationLevel });
  }

  async lockEventRow(tx: Prisma.TransactionClient, eventId: string): Promise<void> {
    await tx.$queryRaw`SELECT id FROM events WHERE id = ${eventId}::uuid FOR UPDATE`;
  }

  findOwn(eventId: string, userId: string, tx: Prisma.TransactionClient = this.prisma) {
    return tx.eventRegistration.findUnique({ where: { eventId_userId: { eventId, userId } }, select: REGISTRATION_SELECT });
  }

  findById(id: string, tx: Prisma.TransactionClient) {
    return tx.eventRegistration.findUnique({ where: { id }, select: REGISTRATION_SELECT });
  }

  countConfirmed(tx: Prisma.TransactionClient, eventId: string) {
    return tx.eventRegistration.count({ where: { eventId, cancelledAt: null, status: { title: REGISTRATION_STATUS_TITLES.confirmed } } });
  }

  createConfirmed(tx: Prisma.TransactionClient, eventId: string, userId: string, qrToken: string) {
    return tx.eventRegistration.create({
      data: { status: { connect: { title: REGISTRATION_STATUS_TITLES.confirmed } }, cancelledAt: null, qrToken,
        event: { connect: { id: eventId } }, user: { connect: { id: userId } } },
      select: REGISTRATION_SELECT,
    });
  }

  reactivate(tx: Prisma.TransactionClient, id: string, qrToken: string) {
    return tx.eventRegistration.update({ where: { id }, data: {
      status: { connect: { title: REGISTRATION_STATUS_TITLES.confirmed } }, cancelledAt: null, qrToken,
    }, select: REGISTRATION_SELECT });
  }

  cancel(tx: Prisma.TransactionClient, id: string, cancelledAt: Date) {
    return tx.eventRegistration.update({ where: { id }, data: {
      cancelledAt, status: { connect: { title: REGISTRATION_STATUS_TITLES.cancelled } },
    }, select: REGISTRATION_SELECT });
  }

  findSupport(tx: Prisma.TransactionClient, eventId: string, userId: string) {
    return tx.eventRegistration.findUnique({ where: { eventId_userId: { eventId, userId } }, select: { id: true } });
  }

  createSupport(tx: Prisma.TransactionClient, eventId: string, userId: string, qrToken: string) {
    return tx.eventRegistration.create({ data: {
      event: { connect: { id: eventId } }, user: { connect: { id: userId } },
      status: { connect: { title: REGISTRATION_STATUS_TITLES.confirmed } }, qrToken,
    }, select: { id: true } });
  }

  publish(tx: Prisma.TransactionClient, eventId: string) {
    return tx.event.update({ where: { id: eventId }, data: { status: { connect: { title: PUBLISHED_STATUS_TITLE } } }, select: { id: true } });
  }

  async getPassById(id: string, userId: string) {
    const pass = await this.prisma.eventRegistration.findFirst({
      where: {
        id,
        userId,
        cancelledAt: null,
        status: { title: REGISTRATION_STATUS_TITLES.confirmed },
        event: { status: { title: PUBLISHED_STATUS_TITLE } },
      },
      select: {
        id: true,
        qrToken: true,
        createdAt: true,
        status: { select: { title: true } },
        event: { select: { id: true, title: true, eventDate: true, startTime: true, endTime: true, location: true, description: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    return pass;
  }

  async createWithQrToken(payload: CreateEventRegistrationPayload, qrToken: string) {
    return this.prisma.eventRegistration.create({
      data: { ...payload, qrToken: qrToken },
      select: { id: true, eventId: true, userId: true, statusId: true, qrToken: true },
    });
  }

  findByUserId(userId: string) {
    return this.prisma.eventRegistration.findMany({
      where: {
        userId,
        cancelledAt: null,
        status: { title: REGISTRATION_STATUS_TITLES.confirmed },
        event: { status: { title: PUBLISHED_STATUS_TITLE } },
      },
      select: {
        id: true,
        registeredAt: true,
        cancelledAt: true,
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

  async loadSupportContext(
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
                status: { title: REGISTRATION_STATUS_TITLES.confirmed },
              },
            },
          },
        },
      },
    });

    if (!event) return null;

    return mapSupportContext(event);
  }
}
