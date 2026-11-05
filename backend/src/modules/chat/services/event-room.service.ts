import { Injectable } from '@nestjs/common';
import { EventRegistrationsService } from '../../event-registrations/services/event-registrations.service.js';
import { ConversationRepository } from '../repositories/conversation.repository.js';
import { NotRegisteredForEventException } from '../exceptions/not-registered-for-event.exception.js';
import type { EventRoomJoinedPayload } from '../types/chat-gateway.types.js';

@Injectable()
export class EventRoomService {
  constructor(
    private readonly registrationsService: EventRegistrationsService,
    private readonly conversationRepository: ConversationRepository,
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

    return {
      conversationId,
      eventId: pass.event.id,
      name: pass.event.title,
      createdAt: conversation?.createdAt.toISOString() ?? now.toISOString(),
      participants: participants.map((participant) => ({
        id: participant.userId,
        fullName: `${participant.user.firstName} ${participant.user.lastName}`.trim(),
      })),
    };
  }
}
