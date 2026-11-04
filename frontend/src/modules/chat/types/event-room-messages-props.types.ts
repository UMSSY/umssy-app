import type { Message } from './conversation.types';
import type { EventRoomParticipant } from './event-room.types';

export interface EventRoomMessagesProps {
  messages: Message[];
  currentUserId: string;
  participants: EventRoomParticipant[];
  isLoading?: boolean;
  isError?: boolean;
  hasMoreMessages?: boolean;
  isEmpty?: boolean;
}
