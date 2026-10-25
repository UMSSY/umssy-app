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

    const { created } = await this.registrationsRepository.createSupport(
      eventId,
      userId,
    );

    if (!created) {
      throw new AlreadySupportedException();
    }

    const updated =
      await this.registrationsRepository.findEventForSupport(eventId);
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
}