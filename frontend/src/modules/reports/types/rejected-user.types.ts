import type { RoleTag } from "@/modules/auth";
import type { DocumentType } from "@/modules/access-request";
import type { AcademicPeriod } from "./registered-user.types";

export interface RejectedUser {
  id: string;
  fullName: string;
  email: string;
  userType: RoleTag;
  identifier: string;
  documentType: DocumentType | null;
  rejectionReason: string | null;
  registeredAt: string;
}

export interface RejectedUsersParams {
  page: number;
  limit: number;
  userType?: RoleTag;
  period?: AcademicPeriod;
  search?: string;
  snapshotAt?: string;
}

export type RejectedUsersExportParams = Pick<RejectedUsersParams, "userType" | "period" | "search">;
