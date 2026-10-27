export type MentorOfferConfirmation =
  | { id: string; status: 'ACTIVE'; alreadyConfirmed: boolean }
  | { expired: true };
