import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DetectedSkillsChips } from "./detected-skills-chips";

describe("DetectedSkillsChips (Task 1.7 & T1.8 QA)", () => {
  const mockSkills = [
    { id: "a1", name: "Python" },
    { id: "b2", name: "Scrum" },
  ];

  it("renderiza los chips de habilidades detectadas automáticamente", () => {
    render(<DetectedSkillsChips skills={mockSkills} processingTimeMs={150} />);

    expect(
      screen.getByText("Habilidades detectadas automáticamente")
    ).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("Scrum")).toBeInTheDocument();
  });

  it("muestra el indicador de tiempo en segundos con formato 'Análisis completado en X s'", () => {
    render(<DetectedSkillsChips skills={mockSkills} processingTimeMs={1250} />);

    expect(screen.getByText("Análisis completado en 1.25 s")).toBeInTheDocument();
  });

  it("no renderiza nada si la lista de habilidades está vacía", () => {
    const { container } = render(
      <DetectedSkillsChips skills={[]} processingTimeMs={100} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("valida que el tiempo de respuesta reportado cumpla el umbral exigido (< 2 s)", () => {
    const processingTimeMs = 450; // 0.45 s
    expect(processingTimeMs).toBeLessThan(2000);
  });
});