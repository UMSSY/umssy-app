export type DocumentSkill = { id: string; name: string; areaId: string };
export type DocumentDecision = 'approved' | 'review' | 'low_confidence';
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
  firstName: string;
  lastName: string;
  duplicate: boolean;
  issuer: string | null;
};
export type VerificationResult = {
  status: DocumentDecision;
  confidence: number | null;
  reason: string;
  skills: DocumentSkill[];
};
