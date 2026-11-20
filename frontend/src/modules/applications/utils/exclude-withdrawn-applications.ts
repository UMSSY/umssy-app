import { WITHDRAWN_STATUS } from "../constants/application.constants";
import type { Application } from "../types/application.types";

export function excludeWithdrawnApplications(applications: readonly Application[]): Application[] {
  return applications.filter((application) => application.status !== WITHDRAWN_STATUS);
}
