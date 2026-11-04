import type { EventRoomParticipant } from '../types/event-room.types';

export function getEventRoomSenderName(
  senderId: string,
  participants: EventRoomParticipant[],
): string {
  const participant = participants.find((item) => item.id === senderId);
  return participant?.fullName.trim() || 'Participante';
}
