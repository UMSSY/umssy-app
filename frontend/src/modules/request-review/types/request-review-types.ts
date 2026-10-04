export type RequestStatus =
  | "DRAFT"
  | "PENDING"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED";

// Contrato de respuesta estandarizado del backend (manual, seccion 1.8)
export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  detail: string;
  ok: boolean;
}

export interface ApproveRequestResponse {
  id: string;
  status: RequestStatus;
}

export interface ApproveRequestButtonProps {
  requestId: string;
  status: RequestStatus;
  applicantEmail: string;
  onApproved?: (response: ApproveRequestResponse) => void;
}
