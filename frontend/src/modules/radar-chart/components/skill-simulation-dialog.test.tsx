import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RADAR_AXIS_NAMES } from "../constants/radar-axis-names.constants";
import { projectRadarScore } from "../utils/project-radar-score";
import { SkillSimulationDialog } from "./skill-simulation-dialog";

const areas = RADAR_AXIS_NAMES.map((axis, index) => ({ ...axis, score: [0, 4.5, 10, 2, 6, 3][index] }));
const jestSkill = { id: 'jest', name: 'Jest', areaId: 'qa', radarPoints: 1, radarHighRelevancePoints: 1.5 };
const verified = { approved: [], highRelevanceSkillIds: [] };
afterEach(cleanup);

describe("Simulación temporal de habilidades", () => {
  it.each(["Escape", "Close"])("permite descartar mediante %s", async mechanism => {
    const close = vi.fn();
    render(<SkillSimulationDialog areas={areas} initialArea="qa" onClose={close} />);
    const user = userEvent.setup();
    if (mechanism === "Escape") await user.keyboard("{Escape}");
    else await user.click(screen.getByRole("button", { name: "Close" }));
    expect(close).toHaveBeenCalledOnce();
  });
  it.each(areas)("usa el puntaje real de $name sin habilidad seleccionada", area => {
    render(<SkillSimulationDialog areas={areas} initialArea={area.id} onClose={vi.fn()} />);
    expect(screen.getByLabelText("Puntaje proyectado")).toHaveTextContent(String(area.score).replace(".", ","));
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", String(area.score));
  });

  it.each([0, 4.5, 10])("limita la proyección con base %s y conserva el radar", base => {
    const scores = areas.map(area => ({ ...area, score: base }));
    const original = JSON.stringify(scores);
    expect(projectRadarScore(scores, "qa", -1).score).toBe(base);
    expect(projectRadarScore(scores, "qa", 11).score).toBe(10);
    expect(projectRadarScore(scores, "qa", NaN).score).toBe(base);
    expect(projectRadarScore(scores, "qa", 10).average).toBe(Number(((base * 5 + 10) / 6).toFixed(2)));
    expect(JSON.stringify(scores)).toBe(original);
  });

  it("actualiza el promedio y descarta la proyección al desmontar", () => {
    const close = vi.fn();
    const onProjectionChange = vi.fn();
    const { unmount } = render(<SkillSimulationDialog areas={areas} initialArea="desarrollo" verification={verified} catalog={[jestSkill]} onProjectionChange={onProjectionChange} onClose={close} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "jest" } });
    expect(onProjectionChange).toHaveBeenLastCalledWith({ areaId: "qa", score: 3 });
    expect(screen.getByLabelText("Puntaje proyectado")).toHaveTextContent("3");
    expect(screen.getByText(/Promedio global proyectado/)).toHaveTextContent("4,42 / 10");
    fireEvent.click(screen.getByRole("button", { name: "Cerrar simulación" }));
    expect(close).toHaveBeenCalledOnce();
    unmount();
    expect(onProjectionChange).toHaveBeenLastCalledWith(null);
    render(<SkillSimulationDialog areas={areas} initialArea="desarrollo" onClose={close} />);
    expect(screen.getByLabelText("Puntaje proyectado")).toHaveTextContent("0");
  });

  it("agrupa habilidades reales no verificadas y selecciona el eje correspondiente", () => {
    render(<SkillSimulationDialog areas={areas} initialArea="desarrollo" onClose={vi.fn()}
      catalog={[{ ...jestSkill, id: "react", name: "React" }, jestSkill, jestSkill]}
      verification={{ ...verified, approved: [{ id: "react", name: "React" }] }} />);

    expect(screen.queryByRole("option", { name: "React" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("option", { name: "Jest" })).toHaveLength(1);
    expect(screen.getByRole("option", { name: "Jest" }).parentElement).toHaveAttribute("label", "QA");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "jest" } });
    expect(screen.getByLabelText("Puntaje proyectado")).toHaveTextContent("3");
  });

  it.each([[[], 3], [["jest"], 3.5]] as const)(
    "uses the bonus only when the backend confirms eligibility (%j)",
    (highRelevanceSkillIds, expected) => {
      render(<SkillSimulationDialog areas={areas} initialArea="qa" catalog={[jestSkill]} onClose={vi.fn()}
        verification={{ approved: [], highRelevanceSkillIds: [...highRelevanceSkillIds] }} />);
      fireEvent.change(screen.getByRole("combobox"), { target: { value: "jest" } });
      expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", String(expected));
      expect(screen.getByLabelText("Puntaje proyectado").tagName).toBe("OUTPUT");
    },
  );

  it("clears selection and projection when eligibility changes", () => {
    const onProjectionChange = vi.fn();
    const props = { areas, initialArea: "qa" as const, catalog: [jestSkill], onClose: vi.fn(), onProjectionChange };
    const view = render(<SkillSimulationDialog {...props} verification={verified} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "jest" } });
    expect(onProjectionChange).toHaveBeenLastCalledWith({ areaId: "qa", score: 3 });

    view.rerender(<SkillSimulationDialog {...props} />);
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.queryByRole("option", { name: "Jest" })).not.toBeInTheDocument();
    expect(onProjectionChange).toHaveBeenLastCalledWith(null);

    view.rerender(<SkillSimulationDialog {...props} verification={{ approved: [], highRelevanceSkillIds: ["jest"] }} />);
    expect(screen.getByRole("combobox")).toHaveValue("");
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "2");
    expect(onProjectionChange).toHaveBeenLastCalledWith(null);
  });
});
