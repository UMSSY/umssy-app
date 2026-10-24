import { CONFIRMED_REGISTRATION_TITLE } from '../constants/event-registrations.constants.js';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { PersistEventRegistrationPayload } from '../types/event-registrations.types.js';

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
  findPassByIdAndUserId(id: string, userId: string) {
    return this.prisma.eventRegistration.findFirst({
      where: {
        id,
        userId,
        cancelledAt: null,
        status: { title: CONFIRMED_REGISTRATION_TITLE },
      },
      select: {
        id: true,
        qrToken: true,
        createdAt: true,
        status: { select: { title: true } },
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            startTime: true,
            endTime: true,
            location: true,
            description: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }
}
