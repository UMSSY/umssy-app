import { PassNotFoundException } from '../exceptions/pass-not-found.exception.js';
import type { SupportTransactionResult } from '../types/support-transaction-result.types.js';
import { COMMUNITY_ORIGIN_TITLE, EXPIRED_STATUS_TITLE, VOTING_STATUS_TITLES } from '../../events/index.js';
import { EventNotFoundException } from '../../events/index.js';
import { AlreadySupportedException } from '../exceptions/already-supported.exception.js';
import { EventNotSupportableException } from '../exceptions/event-not-supportable.exception.js';
import { ProposalExpiredException } from '../exceptions/proposal-expired.exception.js';
import type { EventSupportContext } from '../types/event-support-context.types.js';
import type { SupportResponse } from '../types/support-response.types.js';
import { EventRegistrationsMapper } from '../mappers/event-registrations.mapper.js';
import type { CreateEventRegistrationPayload, MyRegistrationResponse } from '../types/event-registrations.types.js';
import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { EventRegistrationsRepository } from '../repositories/event-registrations.repository.js';
import { mapSupportResponse } from '../mappers/support-response.mapper.js';
import { InternalException } from '../../../common/exceptions/internal.exception.js';
import { Prisma } from '../../../prisma/client.js';
import { EventsService, PUBLISHED_STATUS_TITLE } from '../../events/index.js';
import { EventFullException } from '../exceptions/event-full.exception.js';
import { EventNotOpenException } from '../exceptions/event-not-open.exception.js';
import { RegistrationAlreadyCancelledException } from '../exceptions/registration-already-cancelled.exception.js';
import { RegistrationNotFoundException } from '../exceptions/registration-not-found.exception.js';
import { RegistrationNotOwnedException } from '../exceptions/registration-not-owned.exception.js';
import { REGISTRATION_TRANSACTION_ATTEMPTS } from '../constants/registrations.constants.js';
import { mapRegistration } from '../mappers/registration.mapper.js';
import { assertRegistrationOpen } from '../utils/assert-registration-open.js';
import type { RegistrationResponse } from '../types/registration-response.types.js';

@Injectable()
export class EventRegistrationsService {
  constructor(
    private readonly repository: EventRegistrationsRepository,
    private readonly eventsService: EventsService,
  ) {}

  async getPassById(id: string, userId: string) {
    const pass = await this.repository.getPassById(id, userId);
    if (!pass || !pass.qrToken) throw new PassNotFoundException();
    return pass;
  }

  createWithQrToken(payload: CreateEventRegistrationPayload) {
    return this.repository.createWithQrToken(payload, this.generateQrToken());
  }

  private generateQrToken(): string {
    return randomBytes(32).toString('hex');
  }

  async create(eventId: string, userId: string): Promise<RegistrationResponse> {
    return this.transact(async (tx) => {
      await this.lockEventRow(tx, eventId);
      const event = await this.eventsService.findForRegistration(eventId, tx);
      const existing = await this.repository.findOwn(eventId, userId, tx);
      if (existing && mapRegistration(existing).status === 'confirmed') {
        return mapRegistration(existing);
      }
      if (event.status.title !== PUBLISHED_STATUS_TITLE) throw new EventNotOpenException();
      assertRegistrationOpen(event);
      if (event.capacity !== null) {
        const count = await this.repository.countConfirmed(tx, eventId);
        if (count >= event.capacity) throw new EventFullException();
      }
      const qrToken = this.generateQrToken();
      const registration = existing
        ? await this.repository.reactivate(tx, existing.id, qrToken)
        : await this.repository.createConfirmed(tx, eventId, userId, qrToken);
      return mapRegistration(registration);
    });
  }

  async findOwn(eventId: string, userId: string): Promise<RegistrationResponse> {
    await this.eventsService.findForRegistration(eventId);
    const registration = await this.repository.findOwn(eventId, userId);
    if (!registration) throw new RegistrationNotFoundException();
    return mapRegistration(registration);
  }

  async cancel(registrationId: string, userId: string): Promise<RegistrationResponse> {
    return this.transact(async (tx) => {
      const registration = await this.repository.findById(registrationId, tx);
      if (!registration) throw new RegistrationNotFoundException();
      if (registration.userId !== userId) throw new RegistrationNotOwnedException();
      if (mapRegistration(registration).status === 'cancelled') {
        throw new RegistrationAlreadyCancelledException();
      }
      await this.lockEventRow(tx, registration.eventId);
      const event = await this.eventsService.findForRegistration(registration.eventId, tx);
      assertRegistrationOpen(event);
      return mapRegistration(await this.repository.cancel(tx, registrationId, new Date()));
    });
  }

  private async transact<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < REGISTRATION_TRANSACTION_ATTEMPTS; attempt += 1) {
      try {
        return await this.repository.transaction(operation, Prisma.TransactionIsolationLevel.Serializable);
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || !['P2034', 'P2002'].includes(error.code)) {
          throw error;
        }
      }
    }
    throw new InternalException();
  }

  private lockEventRow(tx: Prisma.TransactionClient, eventId: string): Promise<void> {
    return this.eventsService.lockEventRow(tx, eventId);
  }

  async findMine(userId: string): Promise<MyRegistrationResponse[]> {
    return EventRegistrationsMapper.toMyRegistrationList(await this.findByUserId(userId));
  }

  findByUserId(userId: string) {
    return this.repository.findByUserId(userId);
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

    return mapSupportResponse(eventId, result);
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
    return this.repository.transaction(async (tx) => {
      const beforeLock = await this.loadSupportContext(tx, eventId);
      if (!beforeLock) return null;

      await this.lockEventRow(tx, eventId);

      const event = await this.loadSupportContext(tx, eventId);
      if (!event) return null;

      const existing = await this.repository.findSupport(tx, eventId, userId);
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

      await this.repository.createSupport(tx, eventId, userId, this.generateQrToken());

      const supportCount = event.supportCount + 1;
      const threshold = event.supportThreshold;
      const published =
        event.statusTitle === PUBLISHED_STATUS_TITLE ||
        (threshold !== null && threshold > 0 && supportCount >= threshold);

      if (published && event.statusTitle !== PUBLISHED_STATUS_TITLE) {
        await this.eventsService.publish(tx, eventId);
      }

      return {
        created: true,
        supportCount,
        supportThreshold: threshold,
        published,
      };
    });
  }

  private loadSupportContext(tx: Prisma.TransactionClient, eventId: string): Promise<EventSupportContext | null> {
    return this.eventsService.loadSupportContext(tx, eventId);
  }
}
