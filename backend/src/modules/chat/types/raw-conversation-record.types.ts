import type { RawConversationMessage } from './raw-conversation-message.types.js';
import type { RawConversationUser } from './raw-conversation-user.types.js';
import type { RawConversationEvent } from './raw-conversation-event.types.js';
import type { RawConversationParticipant } from './raw-conversation-participant.types.js';
export interface RawConversationRecord {
  id: string;
  userAId: string | null;
  userBId: string | null;
  createdAt?: Date;
  updatedAt: Date;
  userA: RawConversationUser | null;
  userB: RawConversationUser | null;
  messages: RawConversationMessage[];
  event?: RawConversationEvent | null;
  participants?: RawConversationParticipant[];
}
