import { ROLE_LABELS } from "@/shared/constants/roles.constants";
import type { RoleTag } from "@/modules/auth";

export const USER_TYPE_FILTER_OPTIONS: RoleTag[] = ["estudiante", "titulado", "mentor", "empresa", "administrativo"];

export const EMPTY_DOCUMENT_LABEL = "-";

export const USER_TYPE_SELECT_OPTIONS = USER_TYPE_FILTER_OPTIONS.map((userType) => ({
  value: userType,
  label: ROLE_LABELS[userType],
}));
