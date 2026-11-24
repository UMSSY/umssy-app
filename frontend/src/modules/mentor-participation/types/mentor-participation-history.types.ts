export type MentorParticipationHistoryItem = {
  id: string;
  userId: string;
  status: string;
  queuedAt: string;
  createdAt: string;
  technicalAreaIds: string[];
  orientationTypeIds: string[];
  updatedAt: string;
  statusId: string;
};

export type MentorParticipationHistory = MentorParticipationHistoryItem[];

export type MentorParticipationHistoryPage = {
  items: MentorParticipationHistory;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
