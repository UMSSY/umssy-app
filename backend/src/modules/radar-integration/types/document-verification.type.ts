export type DocumentSkill = {
  id: string;
  name: string;
  areaId: string;
};

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
  duplicate: boolean;
};

export type VerificationResult = {
  status: DocumentDecision;
  confidence: number | null;
  reason: string;
  skills: DocumentSkill[];
};

export type VerificationDocumentContext = VerificationJob & {
  firstName: string;
  lastName: string;
  issuer: string | null;
};
