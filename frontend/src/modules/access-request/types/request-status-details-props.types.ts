import type { RequestStatusResponse } from "./access-request.types";

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