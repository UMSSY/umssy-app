import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MissingRequirements } from "./missing-requirements";

afterEach(() => {
  cleanup();
});

describe("MissingRequirements", () => {
  it("muestra Coincide para los requisitos del perfil y No está en tu perfil para los demás", () => {
    render(
      <MissingRequirements
        requirements={[
          { name: "Python", status: "matched" },
          { name: "React", status: "missing" },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Requisitos vs. tu perfil" })).toBeInTheDocument();
    expect(screen.getByText("Python").closest("li")).toHaveTextContent("Coincide");
    expect(screen.getByText("React").closest("li")).toHaveTextContent("No está en tu perfil");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("usa texto plano sin colores de estado", () => {
    render(
      <MissingRequirements
        requirements={[
          { name: "Python", status: "matched" },
          { name: "React", status: "missing" },
        ]}
      />,
    );

    const matched = screen.getByText("Coincide");
    const missing = screen.getByText("No está en tu perfil");

    expect(matched.className).toContain("font-semibold");
    expect(matched.className).toContain("text-ink");
    expect(missing.className).toContain("text-text-secondary");
    expect(`${matched.className} ${missing.className}`).not.toMatch(/green|amber|red|danger|bg-/);
  });

  it("indica que no hay requisitos pendientes cuando todos coinciden", () => {
    render(<MissingRequirements requirements={[{ name: "Python", status: "matched" }]} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Para esta oportunidad no tienes habilidades ni requisitos pendientes",
    );
  });

  it("acepta un título propio", () => {
    render(<MissingRequirements requirements={[]} title="Otro título" />);

    expect(screen.getByRole("heading", { name: "Otro título" })).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });
});
