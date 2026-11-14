import { describe, expect, it } from "vitest";
import { getWorkspaceSection } from "./get-workspace-section";
import type { RoleTag } from "@/shared/types/role-tag.types";

function vacancyLinks(role: RoleTag) {
  return getWorkspaceSection("/vacancies", [role])?.items.map(({ href }) => href) ?? [];
}

describe("Vacancies navigation by role (HU-11)", () => {
  it.each<RoleTag>(["titulado", "estudiante"])(
    "shows all vacancies, recommended vacancies and my applications to %s (AC-11.16, AC-11.17)",
    (role) => {
      expect(vacancyLinks(role)).toEqual(["/vacancies", "/vacancies/recommended", "/vacancies/my-applications"]);
    },
  );

  it("shows only all vacancies to a mentor (AC-11.16, AC-11.17)", () => {
    expect(vacancyLinks("mentor")).toEqual(["/vacancies"]);
  });

  it.each<RoleTag>(["empresa", "administrativo"])("does not show any vacancies link to %s (AC-11.18)", (role) => {
    expect(vacancyLinks(role)).toEqual([]);
  });
});
