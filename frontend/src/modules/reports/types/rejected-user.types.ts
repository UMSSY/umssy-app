import type { RoleTag } from "@/modules/auth";
import type { DocumentType } from "@/modules/access-requests";

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
