import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MentorFiltersSummary } from "./mentor-filters-summary";

afterEach(() => {
  cleanup();
});

describe("MentorFiltersSummary", () => {
  it("muestra solo la cantidad cuando no hay filtros activos", () => {
    render(
      <MentorFiltersSummary
        search=""
        area=""
        orientation=""
        available={false}
        totalItems={8}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "8 mentores encontrados",
    );
  });

  it("muestra búsqueda aunque sea el único filtro activo", () => {
    render(
      <MentorFiltersSummary
        search="María"
        area=""
        orientation=""
        available={false}
        totalItems={2}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Búsqueda: “María” — 2 mentores encontrados",
    );
  });

  it("muestra área, orientación y disponibilidad activas", () => {
    render(
      <MentorFiltersSummary
        search=""
        area="Backend"
        orientation="Orientación técnica"
        available
        totalItems={4}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Área: Backend · Orientación: Orientación técnica · Solo disponibles — 4 mentores encontrados",
    );
  });

  it("combina todos los filtros activos", () => {
    render(
      <MentorFiltersSummary
        search="María"
        area="Backend"
        orientation="Orientación técnica"
        available
        totalItems={1}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Búsqueda: “María” · Área: Backend · Orientación: Orientación técnica · Solo disponibles — 1 mentor encontrado",
    );
  });

  it("respeta singular y plural", () => {
    const { rerender } = render(
      <MentorFiltersSummary
        search=""
        area=""
        orientation=""
        available={false}
        totalItems={1}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "1 mentor encontrado",
    );

    rerender(
      <MentorFiltersSummary
        search=""
        area=""
        orientation=""
        available={false}
        totalItems={0}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "0 mentores encontrados",
    );
  });

  it("elimina espacios externos del texto buscado", () => {
    render(
      <MentorFiltersSummary
        search="  María  "
        area=""
        orientation=""
        available
        totalItems={1}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Búsqueda: “María” · Solo disponibles — 1 mentor encontrado",
    );
  });
});
