import { APPLICATION_STATUS_OPTIONS, WITHDRAWN_STATUS } from "../constants/application.constants";

export function getStatusOptions(showWithdrawn: boolean) {
  if (showWithdrawn) return APPLICATION_STATUS_OPTIONS;
  return APPLICATION_STATUS_OPTIONS.filter((option) => option.value !== WITHDRAWN_STATUS);
}
