import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RecruiterApplicant } from "../types/radar-recruiter.types";
import { RecruiterCandidateList } from "./recruiter-candidate-list";

const CARLOS: RecruiterApplicant = {
  applicationId: "app-carlos",
  userId: "user-carlos",
  name: "Carlos Mendoza Ríos",
  headline: "Senior Software Engineer",
  email: "carlos@example.com",
  phone: "+591 7000 0001",
  appliedAt: "2026-10-01T10:00:00.000Z",
  state: "applied",
  canViewCv: true,
  version: 3,
  average: 6.5,
  scores: {
    desarrollo: 8.5,
    "cloud-devops": 7,
    "data-ai": 6.5,
    qa: 5,
    ciberseguridad: 4.5,
    "gobernanza-ti": 6,
  },
  evidence: {},
  comparison: {
    match: 82,
    gaps: {
      desarrollo: 1,
      "cloud-devops": 1,
      "data-ai": 1,
      qa: 1,
      ciberseguridad: 1,
      "gobernanza-ti": 1,
    },
  },
  skills: ["React", "Node.js", "AWS", "Docker", "TypeScript"],
};

describe("RecruiterCandidateList", () => {
  afterEach(() => cleanup());

  it("muestra nombre, perfil, porcentaje y tecnologías destacadas", () => {
    render(
      <RecruiterCandidateList
        query=""
        onQueryChange={() => undefined}
        candidates={[CARLOS]}
        selectedApplicationId="app-carlos"
        onSelectCandidate={() => undefined}
      />,
    );

    expect(
      screen.getByText("1 candidato · ordenados por compatibilidad"),
    ).toBeInTheDocument();
    expect(screen.getByText("Carlos Mendoza Ríos")).toBeInTheDocument();
    expect(screen.getByText("Senior Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("82%")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("AWS")).toBeInTheDocument();
    expect(screen.queryByText("TypeScript")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Carlos Mendoza Ríos/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("informa cuando no hay postulantes visibles", () => {
    render(
      <RecruiterCandidateList
        query=""
        onQueryChange={() => undefined}
        candidates={[]}
        selectedApplicationId={null}
        onSelectCandidate={() => undefined}
      />,
    );

    expect(
      screen.getByText(
        "No hay postulantes con radar publicado y consentimiento de visibilidad.",
      ),
    ).toBeInTheDocument();
  });

  it("informa cuando la búsqueda no tiene coincidencias", () => {
    render(
      <RecruiterCandidateList
        query="inexistente"
        onQueryChange={() => undefined}
        candidates={[]}
        selectedApplicationId={null}
        onSelectCandidate={() => undefined}
      />,
    );

    expect(
      screen.getByText('No se encontraron candidatos para "inexistente".'),
    ).toBeInTheDocument();
  });

  it("permite buscar y seleccionar un candidato", () => {
    const onQueryChange = vi.fn();
    const onSelectCandidate = vi.fn();

    render(
      <RecruiterCandidateList
        query=""
        onQueryChange={onQueryChange}
        candidates={[CARLOS]}
        selectedApplicationId={null}
        onSelectCandidate={onSelectCandidate}
      />,
    );

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Buscar candidato" }),
      { target: { value: "Car" } },
    );
    expect(onQueryChange).toHaveBeenCalledWith("Car");

    fireEvent.click(
      screen.getByRole("button", { name: /Carlos Mendoza Ríos/ }),
    );
    expect(onSelectCandidate).toHaveBeenCalledWith("app-carlos");
  });
});
