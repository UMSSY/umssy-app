import { WITHDRAWN_STATUS } from "../constants/application.constants";
import type { ApplicationStatus } from "../types/application.types";

export function canContactApplication(status: ApplicationStatus): boolean {
  return status !== WITHDRAWN_STATUS;
}
