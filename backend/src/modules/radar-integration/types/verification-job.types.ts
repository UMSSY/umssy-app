export type VerificationJob = {
  id: string;
  userId: string;
  sourceId: string;
  sourceType: 'cv' | 'certification';
  filename: string;
  mime: string;
  content: Uint8Array;
  status: string;
  lease: string;
  duplicate: boolean;
};
