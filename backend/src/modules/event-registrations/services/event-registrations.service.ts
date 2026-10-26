import { PassNotFoundException } from '../exceptions/pass-not-found.exception.js';
import { VOTING_STATUS_RESPONSE } from '../constants/event-registrations.constants.js';
import type { SupportTransactionResult } from '../types/support-transaction-result.types.js';
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
    if (!pass || !pass.qrToken) throw new PassNotFoundException();
    return pass;
  }

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
  async support(eventId: string, userId: string): Promise<SupportResponse> {
    const result = await this.registerSupport(
      eventId,
      userId,
      (event) => this.assertSupportable(event),
    );

    if (!result) {
      throw new EventNotFoundException(eventId);
    }

    if (!result.created) {
      throw new AlreadySupportedException();
    }

    return {
      eventId,
      status: result.published ? PUBLISHED_STATUS_TITLE : VOTING_STATUS_RESPONSE,
      supportCount: result.supportCount,
      supportThreshold: result.supportThreshold,
      supportsRemaining: calculateSupportsRemaining(
        result.supportCount,
        result.supportThreshold,
      ),
      progressPercent: calculateProgressPercent(
        result.supportCount,
        result.supportThreshold,
      ),
      hasSupported: true,
    };
  }

  private assertSupportable(event: EventSupportContext): void {
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
  }

  async registerSupport(
    eventId: string,
    userId: string,
    assertSupportable: (event: EventSupportContext) => void,
  ): Promise<SupportTransactionResult | null> {
    return this.prisma.$transaction(async (tx) => {
      const beforeLock = await this.loadSupportContext(tx, eventId);
      if (!beforeLock) return null;

      await tx.$queryRaw`SELECT id FROM events WHERE id = ${eventId}::uuid FOR UPDATE`;

      const event = await this.loadSupportContext(tx, eventId);
      if (!event) return null;

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

      const publishedWhileWaiting =
        event.statusTitle === PUBLISHED_STATUS_TITLE &&
        event.originTitle === COMMUNITY_ORIGIN_TITLE &&
        beforeLock.originTitle === COMMUNITY_ORIGIN_TITLE &&
        VOTING_STATUS_TITLES.includes(beforeLock.statusTitle) &&
        event.supportThreshold !== null &&
        event.supportThreshold > 0 &&
        event.supportCount >= event.supportThreshold;

      assertSupportable(publishedWhileWaiting ? beforeLock : event);

      await tx.eventRegistration.create({
        data: {
          event: { connect: { id: eventId } },
          user: { connect: { id: userId } },
          status: { connect: { title: REGISTRATION_STATUS_TITLES.confirmed } },
          qrToken: randomBytes(32).toString('hex'),
        },
        select: { id: true },
      });

      const supportCount = event.supportCount + 1;
      const threshold = event.supportThreshold;
      const published =
        event.statusTitle === PUBLISHED_STATUS_TITLE ||
        (threshold !== null && threshold > 0 && supportCount >= threshold);

      if (published && event.statusTitle !== PUBLISHED_STATUS_TITLE) {
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
}
