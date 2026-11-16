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
  websiteUrl?: string;
  username: string;
}

export interface UpdateCompanyPayload {
  companyName?: string;
  sector?: string;
  cityId?: string;
  description?: string;
  email?: string;
  phone?: string;
  websiteUrl?: string;
  username?: string;
}

export interface RequestCorrectionPayload {
  reasonCategory: string;
  customDetails: string;
}

export interface RejectCompanyPayload {
  reason?: string;
  reasonCategory?: string;
  customDetails?: string;
}

export interface SubmitCompanyRequestResult {
  id: string;
  requestCode: string;
  status: string;
  submittedAt: string | null;
}

export type CompanyRequestStatus =
  'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'OBSERVED' | string;

export interface CompanyOcrFieldDetail {
  declared: string;
  detectedText: string | null;
  matched: boolean;
  confidence?: number;
  statusMessage?: string;
}

export interface CompanyOcrAnalysisResults {
  companyName?: CompanyOcrFieldDetail;
  city?: CompanyOcrFieldDetail;
  email?: CompanyOcrFieldDetail;
  phone?: CompanyOcrFieldDetail;
  websiteUrl?: CompanyOcrFieldDetail;
  sector?: CompanyOcrFieldDetail;
  requestIntent?: CompanyOcrFieldDetail;
  companyNameMatched?: boolean;
  departmentMatched?: boolean;
  requestIntentMatched?: boolean;
}

export interface CompanyAccessRequestItem {
  id: string;
  requestCode: string | null;
  companyName: string;
  sector: string;
  description: string;
  email: string;
  phone: string;
  websiteUrl?: string;
  username: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  ocrMatchScore: number | null;
  ocrFieldResults: CompanyOcrAnalysisResults | null;
  logoFileId: string | null;
  documentFileId: string | null;
  approvedCompanyId: string | null;
  status: { id: string; title: CompanyRequestStatus };
  city: { id: string; name?: string; title?: string };
}

export interface CompanyRequestsSummary {
  pendingCount: number;
  inReviewCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface CompanyOfficialData {
  requestCode: string;
  companyName: string;
  city: string;
  sector: string;
  email: string;
  phone: string;
  websiteUrl?: string;
  description?: string;
  username: string;
}

export interface CompanyActivationStatusResult {
  state:
    | 'INVALID'
    | 'NOT_FOUND'
    | 'PENDING'
    | 'REJECTED'
    | 'OBSERVED'
    | 'ALREADY_ACTIVATED'
    | 'EXPIRED'
    | 'REQUIRES_CODE'
    | 'INVALID_CODE'
    | 'READY';
  message?: string;
  email?: string;
  data?: CompanyOfficialData;
}

export interface ActivateCompanyAccountPayload {
  requestCode: string;
  email: string;
  code: string;
  password: string;
}

export interface ReportInconsistencyPayload {
  requestCode: string;
  email: string;
  observation: string;
}
