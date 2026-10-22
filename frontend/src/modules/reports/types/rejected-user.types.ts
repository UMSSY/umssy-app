import type { RoleTag } from "@/modules/auth";
import type { DocumentType } from "@/modules/access-request";

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
  search?: string;
}

export type RejectedUsersExportParams = Pick<RejectedUsersParams, "search">;
