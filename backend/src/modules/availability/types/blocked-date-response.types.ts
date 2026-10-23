export interface BlockedDateResponse {
  id: string;
  mentorId: string;
  blockedOn: string;
  reason: string | null;
  createdAt: string;
}
