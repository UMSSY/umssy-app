import { calculateProgressPercent, calculateSupportsRemaining } from '../../../common/utils/support-progress.js';
import { COMMUNITY_ORIGIN_TITLE, EXPIRED_STATUS_TITLE, VOTING_STATUS_TITLES } from '../../events/constants/events.constants.js';
import { EventNotFoundException } from '../../events/exceptions/event-not-found.exception.js';
import { AlreadySupportedException } from '../exceptions/already-supported.exception.js';
import { EventNotSupportableException } from '../exceptions/event-not-supportable.exception.js';
import { ProposalExpiredException } from '../exceptions/proposal-expired.exception.js';
import type { EventSupportContext } from '../types/event-support-context.types.js';
import type { SupportResponse } from '../types/support-response.types.js';
import { EventRegistrationsMapper } from '../mappers/event-registrations.mapper.js';
import type { CreateEventRegistrationPayload, MyRegistrationResponse } from '../types/event-registrations.types.js';
import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { REGISTRATION_STATUS_TITLES } from '../../../common/constants/registration-status.constants.js';
import { InternalException } from '../../../common/exceptions/internal.exception.js';
import { Prisma } from '../../../prisma/client.js';
import { EventsService, PUBLISHED_STATUS_TITLE } from '../../events/index.js';
import { AlreadyRegisteredException } from '../exceptions/already-registered.exception.js';
import { EventFullException } from '../exceptions/event-full.exception.js';
import { EventNotOpenException } from '../exceptions/event-not-open.exception.js';
import { RegistrationAlreadyCancelledException } from '../exceptions/registration-already-cancelled.exception.js';
import { RegistrationNotFoundException } from '../exceptions/registration-not-found.exception.js';
import { RegistrationNotOwnedException } from '../exceptions/registration-not-owned.exception.js';
import { REGISTRATION_SELECT, REGISTRATION_TRANSACTION_ATTEMPTS } from '../constants/registrations.constants.js';
import { mapRegistration } from '../mappers/registration.mapper.js';
import { assertRegistrationOpen } from '../utils/assert-registration-open.js';
import type { RegistrationResponse } from '../types/registration-response.types.js';

@Injectable()
export class EventRegistrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async createWithQrToken(payload: CreateEventRegistrationPayload) {
    // Shared token persistence; callers enforce the rules of their registration flow.
    return this.prisma.eventRegistration.create({
      data: { ...payload, qrToken: randomBytes(32).toString('hex') },
      select: { id: true, eventId: true, userId: true, statusId: true, qrToken: true },
    });
  }

  async create(eventId: string, userId: string): Promise<RegistrationResponse> {
    return this.transact(async (tx) => {
      const event = await this.eventsService.findForRegistration(eventId, tx);
      const existing = await tx.eventRegistration.findUnique({
        where: { eventId_userId: { eventId, userId } },
        select: REGISTRATION_SELECT,
      });
      if (existing && mapRegistration(existing).status === 'confirmed') {
        throw new AlreadyRegisteredException();
      }
      if (event.status.title !== PUBLISHED_STATUS_TITLE) throw new EventNotOpenException();
      assertRegistrationOpen(event);
      if (event.capacity !== null) {
        const count = await tx.eventRegistration.count({
          where: {
            eventId,
            cancelledAt: null,
            status: { title: REGISTRATION_STATUS_TITLES.confirmed },
          },
        });
        if (count >= event.capacity) throw new EventFullException();
      }
      const data = {
        status: { connect: { title: REGISTRATION_STATUS_TITLES.confirmed } },
        cancelledAt: null,
        qrToken: randomBytes(32).toString('hex'),
      };
      const registration = existing
        ? await tx.eventRegistration.update({ where: { id: existing.id }, data, select: REGISTRATION_SELECT })
        : await tx.eventRegistration.create({
            data: { ...data, event: { connect: { id: eventId } }, user: { connect: { id: userId } } },
            select: REGISTRATION_SELECT,
          });
      return mapRegistration(registration);
    });
  }

  async findOwn(eventId: string, userId: string): Promise<RegistrationResponse> {
    await this.eventsService.findForRegistration(eventId);
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
      select: REGISTRATION_SELECT,
    });
    if (!registration) throw new RegistrationNotFoundException();
    return mapRegistration(registration);
  }

  async cancel(registrationId: string, userId: string): Promise<RegistrationResponse> {
    return this.transact(async (tx) => {
      const registration = await tx.eventRegistration.findUnique({
        where: { id: registrationId },
        select: REGISTRATION_SELECT,
      });
      if (!registration) throw new RegistrationNotFoundException();
      if (registration.userId !== userId) throw new RegistrationNotOwnedException();
      if (mapRegistration(registration).status === 'cancelled') {
        throw new RegistrationAlreadyCancelledException();
      }
      const event = await this.eventsService.findForRegistration(registration.eventId, tx);
      assertRegistrationOpen(event);
      return mapRegistration(await tx.eventRegistration.update({
        where: { id: registrationId },
        data: {
          cancelledAt: new Date(),
          status: { connect: { title: REGISTRATION_STATUS_TITLES.cancelled } },
        },
        select: REGISTRATION_SELECT,
      }));
    });
  }

  private async transact<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < REGISTRATION_TRANSACTION_ATTEMPTS; attempt += 1) {
      try {
        return await this.prisma.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || !['P2034', 'P2002'].includes(error.code)) {
          throw error;
        }
      }
    }
    throw new InternalException();
  }
  async findMine(userId: string): Promise<MyRegistrationResponse[]> {
    return EventRegistrationsMapper.toMyRegistrationList(await this.findByUserId(userId));
  }

  findByUserId(userId: string) {
    return this.prisma.eventRegistration.findMany({
      where: {
        userId,
        cancelledAt: null,
        status: { title: REGISTRATION_STATUS_TITLES.confirmed },
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
  async support(eventId: string, userId: string): Promise<SupportResponse> {
    const event = await this.findEventForSupport(eventId);

    if (!event) {
      throw new EventNotFoundException(eventId);
    }

    if (event.statusTitle === EXPIRED_STATUS_TITLE) {
      throw new ProposalExpiredException();
    }

    if (
      event.originTitle !== COMMUNITY_ORIGIN_TITLE ||
      !VOTING_STATUS_TITLES.includes(event.statusTitle)
    ) {
      throw new EventNotSupportableException();
    }

    if (event.votingDeadline && event.votingDeadline.getTime() <= Date.now()) {
      throw new ProposalExpiredException();
    }

    const { created } = await this.createSupport(
      eventId,
      userId,
    );

    if (!created) {
      throw new AlreadySupportedException();
    }

    const updated =
      await this.findEventForSupport(eventId);
    const supportCount = updated?.supportCount ?? event.supportCount + 1;

    return {
      eventId,
      supportCount,
      supportThreshold: event.supportThreshold,
      supportsRemaining: calculateSupportsRemaining(
        supportCount,
        event.supportThreshold,
      ),
      progressPercent: calculateProgressPercent(
        supportCount,
        event.supportThreshold,
      ),
      hasSupported: true,
    };
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
                status: { title: REGISTRATION_STATUS_TITLES.confirmed },
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
          status: { connect: { title: REGISTRATION_STATUS_TITLES.confirmed } },
          qrToken: randomBytes(32).toString('hex'),
        },
        select: { id: true },
      });
      return { created: true };
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        return { created: false };
      }
      throw error;
    }
  }
}
