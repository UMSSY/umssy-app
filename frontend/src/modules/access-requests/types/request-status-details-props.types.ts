import type { RequestStatusResponse } from "./request-status-response.types";

export interface RequestStatusDetailsProps
  extends Pick<
    RequestStatusResponse,
    | "requestCode"
    | "status"
    | "fullName"
    | "submittedAt"
    | "reviewedAt"
    | "rejectionReason"
  > {
  onStartCorrection?: () => void;
}
