import type { EventRoomParticipant } from './event-room.types';

export interface EventRoomInfoPanelProps {
  groupName: string;
  createdAt: string;
  participants: EventRoomParticipant[];
  currentUserId: string;
}
