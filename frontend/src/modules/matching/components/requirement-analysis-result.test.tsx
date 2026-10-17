import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { RequirementAnalysis } from "../types/requirement-terms.types";
import { RequirementAnalysisResult } from "./requirement-analysis-result";

afterEach(() => {
  cleanup();
});

function buildAnalysis(overrides: Partial<RequirementAnalysis["result"]> = {}): RequirementAnalysis {
  return {
    elapsedMs: 30,
    result: {
      tokens: ["python", "san", "simón"],
      terms: ["python", "san", "simón", "san_simón", "san_simon"],
      skills: ["Python"],
      institutions: ["UMSS"],
      ...overrides,
    },
  };
}

describe("RequirementAnalysisResult", () => {
  it("separa los tokens de los términos compuestos", () => {
    render(<RequirementAnalysisResult analysis={buildAnalysis()} />);

    const tokens = screen.getByRole("heading", { name: "Términos" }).parentElement;
    const compounds = screen.getByRole("heading", { name: "Términos compuestos" }).parentElement;

    expect(tokens).toHaveTextContent("python");
    expect(tokens).not.toHaveTextContent("san_simon");
    expect(compounds).toHaveTextContent("san_simón");
    expect(compounds).toHaveTextContent("san_simon");
    expect(compounds).not.toHaveTextContent(/^Términos compuestos\s*python/);
  });

  it("muestra habilidades, instituciones y el tiempo del análisis", () => {
    render(<RequirementAnalysisResult analysis={buildAnalysis()} />);

    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("UMSS")).toBeInTheDocument();
    expect(screen.getByText("Análisis completado en 0.03 s")).toBeInTheDocument();
  });

  it("indica cuando no hay habilidades ni instituciones", () => {
    render(
      <RequirementAnalysisResult
        analysis={buildAnalysis({ skills: [], institutions: [], terms: ["python"], tokens: ["python"] })}
      />,
    );

    expect(screen.getByText("No se detectaron habilidades conocidas en el texto.")).toBeInTheDocument();
    expect(screen.getByText("No se detectaron instituciones.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Términos compuestos" })).not.toBeInTheDocument();
  });

  it("muestra el estado vacío cuando no hay términos reconocibles", () => {
    render(
      <RequirementAnalysisResult
        analysis={buildAnalysis({ tokens: [], terms: [], skills: [], institutions: [] })}
      />,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No encontramos términos reconocibles" })).toBeInTheDocument();
    expect(screen.getByText("Análisis completado en 0.03 s")).toBeInTheDocument();
  });
});
