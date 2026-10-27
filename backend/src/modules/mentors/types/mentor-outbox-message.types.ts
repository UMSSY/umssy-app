export type MentorOutboxMessage = {
  id: string;
  kind: string;
  recipient: string;
  attempts: number;
  payload: { offerId?: string; expiresAt?: string; sanctionEndsAt?: string };
};
