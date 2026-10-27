export type MentorParticipationRequestResponse = {
  id: string;
  userId: string;
  status: string;
  queuedAt: string;
  createdAt: string;
  technicalAreaIds: string[];
  orientationTypeIds: string[];
  email?: string;
  offer?: { id: string; status: string; offeredAt: string; expiresAt: string } | null;
};
