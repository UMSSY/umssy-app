export type RequestStatus = "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";

export type DocumentType = "ACADEMIC_DIPLOMA" | "NATIONAL_TITLE";

export interface AccessRequestSummaryResponse {
  id: string;
  code: string;
  fullName: string;
  email: string;
  sisCode: string;
  documentType: DocumentType;
  submittedAt: string;
  status: RequestStatus;
}

export interface AccessRequestListPayload {
  status: RequestStatus;
  page: number;
  limit: number;
}

export interface AccessRequestListResponse {
  items: AccessRequestSummaryResponse[];
  total: number;
  page: number;
}

export interface AccessRequestListApiResponse {
  data: AccessRequestSummaryResponse[];
  page: number;
  offset: number;
  total: number;
}