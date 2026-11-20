export interface RawConversationParticipant {
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
