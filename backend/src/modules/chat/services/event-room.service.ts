
import { Injectable } from '@nestjs/common';
import { EventRegistrationsService } from '../../event-registrations/services/event-registrations.service.js';
import { ConversationRepository } from '../repositories/conversation.repository.js';
import { NotRegisteredForEventException } from '../exceptions/not-registered-for-event.exception.js';
import { ConversationMapper } from '../mappers/conversation.mapper.js'; // <-- IMPORTAMOS EL MAPPER
import type { EventRoomJoinedPayload } from '../types/chat-gateway.types.js';

@Injectable()
export class EventRoomService {
  constructor(
    private readonly registrationsService: EventRegistrationsService,
    private readonly conversationRepository: ConversationRepository,
    private readonly conversationMapper: ConversationMapper, // <-- INYECTAMOS EL MAPPER
  ) {}

  async joinEventRoom(userId: string, registrationId: string): Promise<EventRoomJoinedPayload> {
    const pass = await this.registrationsService
      .getPassById(registrationId, userId)
      .catch(() => {
        throw new NotRegisteredForEventException();
      });

    const now = new Date();
    const conversationId = await this.conversationRepository.upsertByEventId(
      pass.event.id,
      userId,
      now,
    );

    const conversation = await this.conversationRepository.findById(conversationId);
    const participants = await this.conversationRepository.findParticipantsByConversationId(
      conversationId,
    );

    return this.conversationMapper.toEventRoomJoinedPayload({
      conversationId,
      eventId: pass.event.id,
      eventTitle: pass.event.title,
      createdAt: conversation?.createdAt ?? now,
      participants: participants.map((p) => ({
        userId: p.userId,
        user: {
          firstName: p.user.firstName,
          lastName: p.user.lastName,
        },
      })),
    });
  }
}