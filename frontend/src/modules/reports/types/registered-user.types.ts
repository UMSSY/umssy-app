import type { DocumentType } from "@/modules/access-request";
import type { RoleTag } from "@/modules/auth";

export interface RegisteredUser {
  id: string;
  fullName: string;
  email: string;
  userType: RoleTag;
  identifier: string;
  documentType: DocumentType | null;
  registeredAt: string;
}
