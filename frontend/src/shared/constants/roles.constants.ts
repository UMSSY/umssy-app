import type { RoleTag } from "../types/role-tag.types";

export const ROLE_TAGS: readonly RoleTag[] = ["titulado", "estudiante", "mentor", "empresa", "administrativo"];

export const ROLE_LABELS: Record<RoleTag, string> = {
  titulado: "Titulado",
  estudiante: "Estudiante",
  mentor: "Mentor",
  empresa: "Empresa",
  administrativo: "Administrativo",
};
