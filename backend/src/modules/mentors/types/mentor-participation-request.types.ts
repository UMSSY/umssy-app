export interface MentorParticipationRequest {
  id: string;
  userId: string;
  status: string;
  queuedAt: Date;
  createdAt: Date;
  technicalAreaIds: string[];
  orientationTypeIds: string[];
}
