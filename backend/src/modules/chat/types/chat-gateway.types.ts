export interface SocketMessagePayload {
  conversationId?: string;
  content?: string;
}

export interface EventRoomJoinPayload {
  registrationId: string;
}

export interface EventRoomParticipantPayload {
  id: string;
  fullName: string;
}

export interface EventRoomJoinedPayload {
  conversationId: string;
  eventId: string;
  name: string;
  createdAt: string;
  participants: EventRoomParticipantPayload[];
}

export interface EventRoomErrorPayload {
  code: string;
}
