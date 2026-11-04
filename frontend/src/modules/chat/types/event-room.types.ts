export interface EventRoomParticipant {
  id: string;
  fullName: string;
}

export interface EventRoomSummary {
  conversationId: string;
  eventId: string;
  name: string;
  createdAt: string;
  participants: EventRoomParticipant[];
}
