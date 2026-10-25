import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import {
  calculateProgressPercent,
  calculateSupportsRemaining,
} from '../../../common/utils/support-progress.js';
import {
  COMMUNITY_ORIGIN_TITLE,
  EXPIRED_STATUS_TITLE,
  PUBLISHED_STATUS_TITLE,
  VOTING_STATUS_TITLES,
} from '../../events/constants/events.constants.js';
import { EventNotFoundException } from '../../events/exceptions/event-not-found.exception.js';
import { AlreadySupportedException } from '../exceptions/already-supported.exception.js';
import { EventNotSupportableException } from '../exceptions/event-not-supportable.exception.js';
import { ProposalExpiredException } from '../exceptions/proposal-expired.exception.js';
import { EventRegistrationsMapper } from '../mappers/event-registrations.mapper.js';
import { EventRegistrationsRepository } from '../repositories/event-registrations.repository.js';
import type {
  CreateEventRegistrationPayload,
  MyRegistrationResponse,
} from '../types/event-registrations.types.js';
import type { EventSupportContext } from '../types/event-support-context.types.js';
import type { SupportResponse } from '../types/support-response.types.js';
import {
  VOTING_STATUS_RESPONSE,
} from '../../event-registrations/constants/event-registrations.constants.js';

@Injectable()
export class EventRegistrationsService {
  constructor(
    private readonly registrationsRepository: EventRegistrationsRepository,
  ) {}

  async createWithQrToken(payload: CreateEventRegistrationPayload) {
    // TODO: HU-05 debe usarlo al crear la preinscripción y conservar el token al confirmarla; HU-06, al crear la inscripción directa.
    // Ambos flujos deben validar estado, cupo, usuario e idempotencia, e integrar o adaptar este método a su transacción.
    // Este método solo genera y persiste el token; no reemplaza esas reglas del flujo de inscripción.
    const qrToken = randomBytes(32).toString('hex');
    return this.registrationsRepository.create({ ...payload, qrToken });
  }

  async findMine(userId: string): Promise<MyRegistrationResponse[]> {
    const registrations =
      await this.registrationsRepository.findByUserId(userId);
    return EventRegistrationsMapper.toMyRegistrationList(registrations);
  }

  async support(eventId: string, userId: string): Promise<SupportResponse> {
    const result = await this.registrationsRepository.registerSupport(
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
}