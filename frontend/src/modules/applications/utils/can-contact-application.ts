import { CONTACTABLE_STATUSES } from "../constants/application.constants";
import type { ApplicationStatus } from "../types/application.types";

export function canContactApplication(status: ApplicationStatus): boolean {
  return CONTACTABLE_STATUSES.includes(status);
}
