export interface CityItem {
  id: string;
  name: string;
}

export interface CreateCompanyRequestPayload {
  companyName: string;
  sector: string;
  cityId: string;
  description: string;
  email: string;
  phone: string;
  websiteUrl: string;
  username: string;
}

export interface SubmitCompanyRequestResult {
  id: string;
  requestCode: string;
  status: string;
  submittedAt: string | null;
}

export type CompanyRequestStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED";

export interface CompanyAccessRequestItem {
  id: string;
  requestCode: string | null;
  companyName: string;
  sector: string;
  description: string;
  email: string;
  phone: string;
  websiteUrl: string;
  username: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  ocrMatchScore: number | null;
  ocrFieldResults: {
    companyNameMatched?: boolean;
    departmentMatched?: boolean;
    requestIntentMatched?: boolean;
  } | null;
  logoFileId: string | null;
  documentFileId: string | null;
  approvedCompanyId: string | null;
  status: { id: string; title: CompanyRequestStatus };
  city: { id: string; name: string };
}

export interface CompanyRequestsSummary {
  pendingCount: number;
  inReviewCount: number;
  approvedCount: number;
  rejectedCount: number;
}