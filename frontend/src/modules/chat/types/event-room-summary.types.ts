import type { EventRoomParticipant } from './event-room-participant.types';

export interface EventRoomSummary {
  conversationId: string;
  eventId: string;
  name: string;
  createdAt: string;
  participants: EventRoomParticipant[];
}