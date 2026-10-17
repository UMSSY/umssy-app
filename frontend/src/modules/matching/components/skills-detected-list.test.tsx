import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SkillsDetectedList } from "./skills-detected-list";

afterEach(() => {
  cleanup();
});

describe("SkillsDetectedList", () => {
  it("no renderiza nada cuando no hay habilidades", () => {
    const { container } = render(<SkillsDetectedList skills={[]} processingTimeMs={10} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("muestra cada habilidad como etiqueta", () => {
    render(<SkillsDetectedList skills={["Python", "Node.js"]} />);

    expect(
      screen.getByRole("heading", { name: "Habilidades detectadas automáticamente" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Python",
      "Node.js",
    ]);
  });

  it("muestra el tiempo de análisis cuando se informa", () => {
    render(<SkillsDetectedList skills={["Python"]} processingTimeMs={30} />);

    expect(screen.getByText("Análisis completado en 0.03 s")).toBeInTheDocument();
  });

  it("omite el tiempo de análisis cuando no se informa", () => {
    render(<SkillsDetectedList skills={["Python"]} />);

    expect(screen.queryByText(/Análisis completado/)).not.toBeInTheDocument();
  });
});
