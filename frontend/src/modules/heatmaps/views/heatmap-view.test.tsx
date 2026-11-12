import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { downloadFile } from "@/shared/utils/download-file";
import { HEATMAP_FILTER_TEXT } from "../constants/heatmap-filters.constants";
import { HEATMAP_TEXT } from "../constants/heatmap-text.constants";
import { heatmapsService } from "../services/heatmaps.service";
import type { HeatmapData } from "../types/heatmap.types";
import { HeatmapView } from "./heatmap-view";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("@/shared/utils/download-file", () => ({ downloadFile: vi.fn() }));

const DATA: HeatmapData = {
  heatmapType: "skills-by-experience",
  baseCount: 192,
  baseLabel: "titulados con experiencia laboral registrada",
  columns: [
    { id: "junior", label: "Junior", sublabel: "hasta 2 años · 96 titulados", total: 96 },
    { id: "senior", label: "Senior", sublabel: "más de 5 años · 0 titulados", total: 0 },
  ],
  extraColumnsConfig: [
    { id: "total_mastering", label: "Total que la dominan", sublabel: "de 192 titulados", format: "count" },
    { id: "highest_adoption", label: "Mayor adopción en", format: "badge" },
  ],
  rows: [
    {
      skillId: "sql",
      skillName: "SQL y bases de datos",
      cells: [
        { columnId: "junior", count: 66, total: 96, percentage: 69 },
        { columnId: "senior", isEmpty: true },
      ],
      extraValues: { total_mastering: { count: 140, percentage: 73, subtext: "73 % del total" }, highest_adoption: { badgeText: "Junior" } },
    },
  ],
  quickReadSummary: "SQL y bases de datos tiene alta adopción en los tres niveles.",
};

async function renderView(type: Parameters<typeof HeatmapView>[0]["type"] = "skills-by-experience") {
  renderWithQuery(<HeatmapView type={type} />);
  await screen.findByRole("table");
}

describe("HeatmapView", () => {
  beforeEach(() => {
    vi.spyOn(heatmapsService, "getHeatmap").mockResolvedValue({ statusCode: 200, ok: true, detail: "ok", data: DATA });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.mocked(toast.info).mockClear();
    vi.mocked(toast.success).mockClear();
    vi.mocked(downloadFile).mockClear();
  });

  it("muestra breadcrumb, base procesada, matriz, columnas extra, leyenda y lectura rápida", async () => {
    await renderView();

    const breadcrumb = screen.getByRole("navigation", { name: "Ruta de navegación" });
    expect(within(breadcrumb).getByText("Mapa de calor")).toBeInTheDocument();
    expect(within(breadcrumb).getByText("Habilidades vs. Experiencia")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Habilidades vs. años de experiencia" })).toBeInTheDocument();
    expect(screen.getByText("Base: 192 titulados con experiencia laboral registrada")).toBeInTheDocument();
    expect(screen.getByText("69%")).toBeInTheDocument();
    expect(screen.getByText("66 titulados")).toBeInTheDocument();
    expect(screen.getByText("140")).toBeInTheDocument();
    expect(screen.getByText("73 % del total")).toBeInTheDocument();
    expect(screen.getByLabelText("SQL y bases de datos, Senior: Sin datos")).toHaveTextContent("-");
    expect(screen.getByLabelText("Leyenda del mapa de calor")).toBeInTheDocument();
    expect(screen.getByText(DATA.quickReadSummary ?? "")).toBeInTheDocument();
  });

  it("muestra conteo primero y porcentaje entre paréntesis en HU5", async () => {
    await renderView("skills-by-career");
    expect(screen.getByText("66")).toBeInTheDocument();
    expect(screen.getByText("(69%)")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Carrera" })).not.toBeInTheDocument();
  });

  it("muestra los filtros de carrera, gestión y meses en HU8", async () => {
    await renderView();
    expect(screen.getByRole("combobox", { name: "Carrera" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Gestión" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Meses" })).toBeInTheDocument();
  });

  it("aplica el filtro por gestión académica y semestre, y marca el botón como activo", async () => {
    const user = userEvent.setup();
    const getHeatmap = vi.mocked(heatmapsService.getHeatmap);
    await renderView();

    await user.click(screen.getByRole("button", { name: HEATMAP_FILTER_TEXT.dateRangeButton }));
    const dialog = await screen.findByRole("dialog", { name: HEATMAP_FILTER_TEXT.dialogTitle });
    await user.click(within(dialog).getByRole("combobox", { name: `Año (${HEATMAP_FILTER_TEXT.startSection})` }));
    await user.click(await screen.findByRole("option", { name: "2023" }));
    await user.click(within(dialog).getByRole("combobox", { name: `Semestre (${HEATMAP_FILTER_TEXT.startSection})` }));
    await user.click(await screen.findByRole("option", { name: "2do Semestre" }));
    await user.click(within(dialog).getByRole("button", { name: HEATMAP_FILTER_TEXT.apply }));

    await waitFor(() =>
      expect(getHeatmap).toHaveBeenLastCalledWith("skills-by-experience", { semesterRange: { startYear: 2023, startSemester: 2, endYear: 2026, endSemester: 2 }, year: undefined }),
    );
    expect(screen.getByRole("button", { name: `${HEATMAP_FILTER_TEXT.dateRangeButton}: 2023-2 a 2026-2` })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(HEATMAP_FILTER_TEXT.yearOverridden)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: HEATMAP_FILTER_TEXT.clearDateRange }));
    expect(screen.getByRole("button", { name: HEATMAP_FILTER_TEXT.dateRangeButton })).toHaveAttribute("aria-pressed", "false");
  });

  it("valida que el inicio del rango no sea posterior al final", async () => {
    const user = userEvent.setup();
    await renderView();

    await user.click(screen.getByRole("button", { name: HEATMAP_FILTER_TEXT.dateRangeButton }));
    const dialog = await screen.findByRole("dialog", { name: HEATMAP_FILTER_TEXT.dialogTitle });
    await user.click(within(dialog).getByRole("combobox", { name: `Año (${HEATMAP_FILTER_TEXT.endSection})` }));
    await user.click(await screen.findByRole("option", { name: "2022" }));
    await user.click(within(dialog).getByRole("combobox", { name: `Semestre (${HEATMAP_FILTER_TEXT.startSection})` }));
    await user.click(await screen.findByRole("option", { name: "2do Semestre" }));
    await user.click(within(dialog).getByRole("combobox", { name: `Semestre (${HEATMAP_FILTER_TEXT.endSection})` }));
    await user.click(await screen.findByRole("option", { name: "1er Semestre" }));
    await user.click(within(dialog).getByRole("button", { name: HEATMAP_FILTER_TEXT.apply }));

    expect(within(dialog).getByText(HEATMAP_FILTER_TEXT.rangeError)).toBeInTheDocument();
  });

  it("exporta CSV y avisa que el PDF está pendiente de integración", async () => {
    const user = userEvent.setup();
    await renderView();

    await user.click(screen.getByRole("button", { name: HEATMAP_TEXT.export }));
    await user.click(await screen.findByRole("menuitem", { name: /Exportar CSV/ }));
    expect(downloadFile).toHaveBeenCalledWith(expect.any(Blob), "mapa-calor-skills-by-experience.csv");

    await user.click(screen.getByRole("button", { name: HEATMAP_TEXT.export }));
    await user.click(await screen.findByRole("menuitem", { name: /Exportar PDF/ }));
    expect(toast.info).toHaveBeenCalledWith(HEATMAP_TEXT.pdfPending, expect.anything());
  });

  it("muestra el estado vacío cuando no hay base procesada", async () => {
    vi.mocked(heatmapsService.getHeatmap).mockResolvedValue({
      statusCode: 200,
      ok: true,
      detail: "ok",
      data: { ...DATA, baseCount: 0, columns: DATA.columns.map((column) => ({ ...column, total: 0 })) },
    });
    renderWithQuery(<HeatmapView type="skills-by-experience" />);

    expect(await screen.findByText("No hay titulados con experiencia laboral registrada para los filtros seleccionados.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: HEATMAP_TEXT.export })).toBeDisabled();
  });
});
