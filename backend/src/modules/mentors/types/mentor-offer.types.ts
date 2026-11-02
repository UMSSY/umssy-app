export interface MentorOfferRecord {
  requestId: string;
  status: string;
  requestStatus: string;
  technicalAreaIds: string[];
  orientationTypeIds: string[];
}

export type MentorOfferConfirmation =
  | { id: string; status: 'ACTIVE'; alreadyConfirmed: boolean }
  | { expired: true };
