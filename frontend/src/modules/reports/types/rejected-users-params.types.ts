import type { RoleTag } from "@/modules/auth";
import type { AcademicPeriod } from "./academic-period.types";

export interface RejectedUsersParams {
  page: number;
  limit: number;
  userType?: RoleTag;
  period?: AcademicPeriod;
  search?: string;
  snapshotAt?: string;
}
