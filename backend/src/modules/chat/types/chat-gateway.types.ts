export interface SocketMessagePayload {
  conversationId?: string;
  content?: string;
}

export interface EventRoomJoinPayload {
  eventId: string;
}
