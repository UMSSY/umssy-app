import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { CONFIRMED_REGISTRATION_TITLE } from '../constants/event-registrations.constants.js';
import type { EventSupportContext } from '../types/event-support-context.types.js';

const PRISMA_UNIQUE_VIOLATION = 'P2002';

@Injectable()
export class EventRegistrationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string) {
    return this.prisma.eventRegistration.findMany({
      where: {
        userId,
        cancelledAt: null,
        status: { title: CONFIRMED_REGISTRATION_TITLE },
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

  async findEventForSupport(
    eventId: string,
  ): Promise<EventSupportContext | null> {
    const event = await this.prisma.event.findUnique({
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

  async createSupport(
    eventId: string,
    userId: string,
  ): Promise<{ created: boolean }> {
    try {
      await this.prisma.eventRegistration.create({
        data: {
          event: { connect: { id: eventId } },
          user: { connect: { id: userId } },
          status: { connect: { title: CONFIRMED_REGISTRATION_TITLE } },
          qrToken: randomBytes(32).toString('hex'),
        },
        select: { id: true },
      });
      return { created: true };
    } catch (error) {
      if ((error as { code?: string }).code === PRISMA_UNIQUE_VIOLATION) {
        return { created: false };
      }
      throw error;
    }
  }
}