import type { VerificationSkill } from './verification-skill.types';
import type { VerificationStatus } from './verification-status.types';
export interface DocumentVerification {
  id: string;
  sourceId: string;
  sourceType: 'cv' | 'certification';
  filename: string;
  mime: string;
  sizeBytes: number;
  noticeRead: boolean;
  radarVersion: number | null;
  publishedIds: string[];
  status: VerificationStatus;
  confidence: number | null;
  reason: string;
  active: boolean;
  synced: boolean;
  available: boolean;
  createdAt: string;
  decidedAt: string | null;
  skills: VerificationSkill[];
  ownerName?: string;
}
