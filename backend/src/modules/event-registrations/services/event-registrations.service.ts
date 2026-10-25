import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import {
  calculateProgressPercent,
  calculateSupportsRemaining,
} from '../../../common/utils/support-progress.js';
import {
  COMMUNITY_ORIGIN_TITLE,
  EXPIRED_STATUS_TITLE,
  VOTING_STATUS_TITLES,
} from '../../events/constants/events.constants.js';
import { EventNotFoundException } from '../../events/exceptions/event-not-found.exception.js';
import { AlreadySupportedException } from '../exceptions/already-supported.exception.js';
import { EventNotSupportableException } from '../exceptions/event-not-supportable.exception.js';
import { PassAccessDeniedException } from '../exceptions/pass-access-denied.exception.js';
import { PassNotFoundException } from '../exceptions/pass-not-found.exception.js';
import { ProposalExpiredException } from '../exceptions/proposal-expired.exception.js';
import { EventRegistrationsMapper } from '../mappers/event-registrations.mapper.js';
import { EventRegistrationsRepository } from '../repositories/event-registrations.repository.js';
import type {
  CreateEventRegistrationPayload,
  MyRegistrationResponse,
} from '../types/event-registrations.types.js';
import type { SupportResponse } from '../types/support-response.types.js';

@Injectable()
export class EventRegistrationsService {
  constructor(
    private readonly registrationsRepository: EventRegistrationsRepository,
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
    const qrToken = randomBytes(32).toString('hex');
    return this.registrationsRepository.create({ ...payload, qrToken });
  }

  async findMine(userId: string): Promise<MyRegistrationResponse[]> {
    const registrations =
      await this.registrationsRepository.findByUserId(userId);
    return EventRegistrationsMapper.toMyRegistrationList(registrations);
  }

  async getPassById(passId: string, userId: string) {
    const pass = await this.registrationsRepository.findPassByIdAndUserId(
      passId,
      userId,
    );

    if (!pass) {
      throw new PassNotFoundException();
    }

    return pass;
  }

  async support(eventId: string, userId: string): Promise<SupportResponse> {
    const event =
      await this.registrationsRepository.findEventForSupport(eventId);

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

    const { created } = await this.registrationsRepository.createSupport(
      eventId,
      userId,
    );

      const event = await this.loadSupportContext(tx, eventId);
      if (!event) return null;

    const updated =
      await this.registrationsRepository.findEventForSupport(eventId);
    const supportCount = updated?.supportCount ?? event.supportCount + 1;

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
          status: { connect: { title: REGISTRATION_STATUS_TITLES.confirmed } },
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
}
