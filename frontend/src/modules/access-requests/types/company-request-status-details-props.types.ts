import type { CompanyRequestStatusResponse } from "./company-request-status.types";

export interface CompanyRequestStatusDetailsProps {
  request: CompanyRequestStatusResponse;
  onStartCorrection?: () => void;
}
