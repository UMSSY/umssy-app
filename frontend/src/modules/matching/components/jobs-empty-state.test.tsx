import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PROFILE_SKILLS_ROUTE } from "../constants/job-matching.constants";
import { JobsEmptyState } from "./jobs-empty-state";

afterEach(() => {
  cleanup();
});

describe("JobsEmptyState", () => {
  it("muestra el estado de perfil incompleto con el texto del diseño y lleva al perfil", () => {
    render(<JobsEmptyState variant="incomplete-profile" />);

    expect(screen.getByRole("heading", { name: "Aún no podemos calcular tu afinidad" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "No encontramos habilidades en tu perfil todavía. Complétalo para ver qué vacantes coinciden más contigo.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Completar mi perfil" })).toHaveAttribute(
      "href",
      PROFILE_SKILLS_ROUTE,
    );
  });

  it("muestra el estado sin coincidencias con enlace a revisar el perfil", () => {
    render(<JobsEmptyState variant="no-matches" />);

    expect(
      screen.getByRole("heading", { name: "Por ahora no hay vacantes que coincidan con tu perfil" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Revisar mi perfil" })).toHaveAttribute("href", PROFILE_SKILLS_ROUTE);
  });
});
