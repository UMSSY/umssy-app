import type { EventRoomParticipantPayload } from './event-room-participant-payload.types.js';

export interface EventRoomJoinedPayload {
  conversationId: string;
  eventId: string;
  name: string;
  createdAt: string;
  participants: EventRoomParticipantPayload[];
}
