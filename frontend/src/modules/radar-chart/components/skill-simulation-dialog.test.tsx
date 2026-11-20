import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RADAR_AXIS_NAMES } from "../constants/radar-axis-names.constants";
import { projectRadarScore } from "../utils/project-radar-score";
import { SkillSimulationDialog } from "./skill-simulation-dialog";

const areas = RADAR_AXIS_NAMES.map((axis, index) => ({ ...axis, score: [0, 4.5, 10, 2, 6, 3][index] }));
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
  it.each(areas)("usa el puntaje real de $name y reinicia al cambiar", area => {
    render(<SkillSimulationDialog areas={areas} initialArea="desarrollo" onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Puntaje proyectado"), { target: { value: "9" } });
    fireEvent.change(screen.getByLabelText("Competencia"), { target: { value: area.id } });
    expect(screen.getByRole("spinbutton")).toHaveValue(area.score);
    expect(screen.getByRole("slider")).toHaveValue(String(area.score));
    expect(screen.getByRole("spinbutton")).toHaveAttribute("min", String(area.score));
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
    const { unmount } = render(<SkillSimulationDialog areas={areas} initialArea="desarrollo" onClose={close} />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "9" } });
    expect(screen.getByRole("spinbutton")).toHaveValue(9);
    expect(screen.getByText(/Promedio global proyectado/)).toHaveTextContent("5,75 / 10");
    fireEvent.click(screen.getByRole("button", { name: "Cerrar simulación" }));
    expect(close).toHaveBeenCalledOnce();
    unmount();
    render(<SkillSimulationDialog areas={areas} initialArea="desarrollo" onClose={close} />);
    expect(screen.getByRole("spinbutton")).toHaveValue(0);
  });

  it("agrupa habilidades reales no verificadas y selecciona el eje correspondiente", () => {
    render(<SkillSimulationDialog areas={areas} initialArea="desarrollo" onClose={vi.fn()}
      catalog={[{ id: "react", name: "React" }, { id: "jest", name: "Jest" }]}
      approved={[{ id: "react", name: "React" }]} />);

    expect(screen.queryByRole("option", { name: "React" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Jest" }).parentElement).toHaveAttribute("label", "QA");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "jest" } });
    expect(screen.getByRole("spinbutton")).toHaveValue(2);
  });

  it("conserva la edición decimal y ajusta los valores fuera de rango al salir", () => {
    render(<SkillSimulationDialog areas={areas} initialArea="cloud-devops" onClose={vi.fn()} />);
    const score = screen.getByRole("spinbutton");
    fireEvent.change(score, { target: { value: "6.7" } });
    expect(screen.getByRole("slider")).toHaveValue("6.7");
    fireEvent.change(score, { target: { value: "15" } });
    fireEvent.blur(score);
    expect(score).toHaveValue(10);
    fireEvent.change(score, { target: { value: "0" } });
    fireEvent.blur(score);
    expect(score).toHaveValue(4.5);
  });
});
