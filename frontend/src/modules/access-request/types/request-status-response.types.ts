import type { DocumentType } from "../constants/document-types.constants";

export interface RequestStatusResponse {
  requestCode: string;
  status: string;
  fullName?: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  document: { type: DocumentType; size: number; mimeType: string } | null;
}
