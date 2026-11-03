import { Injectable } from '@nestjs/common';
import { EventRegistrationsService } from '../../event-registrations/services/event-registrations.service.js';
import { ConversationRepository } from '../repositories/conversation.repository.js';
import { NotRegisteredForEventException } from '../exceptions/not-registered-for-event.exception.js';

@Injectable()
export class EventRoomService {
  constructor(
    private readonly registrationsService: EventRegistrationsService,
    private readonly conversationRepository: ConversationRepository,
  ) {}

  async joinEventRoom(userId: string, eventId: string): Promise<string> {
    let registration;
    try {
      registration = await this.registrationsService.findOwn(eventId, userId);
    } catch {
      throw new NotRegisteredForEventException();
    }

    if (!registration || registration.status !== 'confirmed') {
      throw new NotRegisteredForEventException();
    }

    const now = new Date();
    const conversationId = await this.conversationRepository.upsertByEventId(
      eventId,
      userId,
      now,
    );

    return conversationId;
  }
}