import type { RoleTag } from "@/shared/types/role-tag.types";

const ROLE_LABELS: Record<RoleTag, string> = {
  titulado: "Egresado",
  estudiante: "Egresado",
  mentor: "Mentor",
  empresa: "Reclutador",
  administrativo: "Admin",
};

export function formatRoleLabel(roleTag: RoleTag): string {
  return ROLE_LABELS[roleTag];
}
