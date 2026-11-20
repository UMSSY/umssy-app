import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQuery } from "@/shared/testing/render-with-query";
import { downloadFile } from "@/shared/utils/download-file";
import { HEATMAP_FILTER_TEXT, HEATMAP_LAST_YEAR } from "../constants/heatmap-filters.constants";
import { HEATMAP_TEXT } from "../constants/heatmap-text.constants";
import { surveysService } from "@/modules/surveys";
import { heatmapsService } from "../services/heatmaps.service";
import type { HeatmapData } from "../types/heatmap-data.types";
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
    vi.spyOn(surveysService, "listCareers").mockResolvedValue({
      statusCode: 200,
      ok: true,
      detail: "ok",
      data: [{ id: "career-systems", title: "Licenciatura en Ingeniería de Sistemas" }],
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.mocked(toast.info).mockClear();
    vi.mocked(toast.success).mockClear();
    vi.mocked(downloadFile).mockClear();
  });

  it("muestra base procesada, matriz, columnas extra, leyenda y lectura rápida", async () => {
    await renderView();

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

  describe("HU5 - Mapa de calor de habilidades técnicas por carrera", () => {
    const CAREER_DATA: HeatmapData = {
      heatmapType: "skills-by-career",
      baseCount: 220,
      baseLabel: "egresados con habilidades técnicas registradas",
      columns: [
        { id: "career-systems", label: "Ing. de Sistemas", sublabel: "(n = 128)", total: 128 },
        { id: "career-informatics", label: "Ing. Informática", sublabel: "(n = 92)", total: 92 },
      ],
      rows: [
        {
          skillId: "js",
          skillName: "JavaScript",
          cells: [
            { columnId: "career-systems", count: 96, total: 128, percentage: 75 },
            { columnId: "career-informatics", count: 20, total: 92, percentage: 21.7 },
          ],
        },
      ],
      quickReadSummary: "En Ing. de Sistemas, JavaScript (75,0%) tiene mayor presencia. En Ing. Informática, JavaScript (21,7%) tiene mayor presencia.",
    };
    const DARK_CELL = "JavaScript · Ing. de Sistemas. 96 de 128 egresados (75,0%)";
    const LIGHT_CELL = "JavaScript · Ing. Informática. 20 de 92 egresados (21,7%)";

    beforeEach(() => {
      vi.mocked(heatmapsService.getHeatmap).mockResolvedValue({ statusCode: 200, ok: true, detail: "ok", data: CAREER_DATA });
    });

    it("muestra título, descripción y filtros con sus valores por defecto", async () => {
      await renderView("skills-by-career");

      expect(screen.getByRole("heading", { level: 1, name: "Mapa de calor de habilidades técnicas por carrera" })).toBeInTheDocument();
      expect(screen.getByText("Compara la presencia de habilidades técnicas en los egresados de Ingeniería de Sistemas e Ingeniería informática.")).toBeInTheDocument();
      expect(screen.getByRole("combobox", { name: "Carrera" })).toHaveTextContent("Todas (Sistemas e Informática)");
      expect(screen.getByRole("combobox", { name: "Promoción (año de egreso)" })).toHaveTextContent("Todas");
    });

    it("muestra la base con ícono de ayuda y las cabeceras de carrera con n", async () => {
      await renderView("skills-by-career");

      expect(screen.getByText("Base: 220 egresados con habilidades técnicas registradas")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^Más información: Egresados con encuesta respondida/ })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Habilidad técnica" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /Ing\. de Sistemas\s*\(n = 128\)/ })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /Ing\. Informática\s*\(n = 92\)/ })).toBeInTheDocument();
    });

    it("muestra conteo arriba y porcentaje con un decimal entre paréntesis debajo", async () => {
      await renderView("skills-by-career");

      expect(screen.getByText("96")).toBeInTheDocument();
      expect(screen.getByText("(75,0%)")).toBeInTheDocument();
      expect(screen.getByText("(21,7%)")).toBeInTheDocument();
    });

    it("usa texto blanco en celdas oscuras y texto oscuro en celdas claras", async () => {
      await renderView("skills-by-career");

      expect(screen.getByLabelText(DARK_CELL)).toHaveClass("text-white");
      expect(screen.getByLabelText(LIGHT_CELL)).toHaveClass("text-ink");
    });

    it("muestra un tooltip de dos líneas con habilidad · carrera y la proporción", async () => {
      const user = userEvent.setup();
      await renderView("skills-by-career");

      await user.hover(screen.getByLabelText(DARK_CELL));

      expect(await screen.findByText("JavaScript · Ing. de Sistemas")).toBeInTheDocument();
      expect(screen.getByText("96 de 128 egresados (75,0%)")).toBeInTheDocument();
    });

    it("muestra la leyenda 0%-100%, el texto de ayuda de celdas y la lectura rápida", async () => {
      await renderView("skills-by-career");

      const legend = screen.getByLabelText("Leyenda del mapa de calor");
      expect(legend).toHaveTextContent("0%");
      expect(legend).toHaveTextContent("100%");
      expect(screen.getByText("Cada celda muestra la cantidad de egresados y el porcentaje que representa en su carrera.")).toBeInTheDocument();
      expect(screen.getByRole("region", { name: "Lectura rápida" })).toHaveTextContent(CAREER_DATA.quickReadSummary ?? "");
    });

    it("filtra por carrera", async () => {
      const user = userEvent.setup();
      const getHeatmap = vi.mocked(heatmapsService.getHeatmap);
      await renderView("skills-by-career");

      await user.click(screen.getByRole("combobox", { name: "Carrera" }));
      await user.click(await screen.findByRole("option", { name: "Licenciatura en Ingeniería de Sistemas" }));

      await waitFor(() => expect(getHeatmap).toHaveBeenLastCalledWith("skills-by-career", { careerId: "career-systems" }));
    });
  });

  it("muestra los filtros de carrera, gestión y meses en HU8 y filtra por la carrera de la BD", async () => {
    const user = userEvent.setup();
    const getHeatmap = vi.mocked(heatmapsService.getHeatmap);
    await renderView();
    expect(screen.getByRole("combobox", { name: "Gestión" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Meses" })).toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: "Carrera" }));
    await user.click(await screen.findByRole("option", { name: "Licenciatura en Ingeniería de Sistemas" }));

    await waitFor(() => expect(getHeatmap).toHaveBeenLastCalledWith("skills-by-experience", { careerId: "career-systems" }));
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
      expect(getHeatmap).toHaveBeenLastCalledWith("skills-by-experience", { semesterRange: { startYear: 2023, startSemester: 2, endYear: HEATMAP_LAST_YEAR, endSemester: 2 }, year: undefined }),
    );
    expect(screen.getByRole("button", { name: `${HEATMAP_FILTER_TEXT.dateRangeButton}: 2023-2 a ${HEATMAP_LAST_YEAR}-2` })).toHaveAttribute("aria-pressed", "true");
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

  it("exporta CSV y descarga el PDF generado por el backend", async () => {
    const pdf = new Blob(["%PDF-1.4"], { type: "application/pdf" });
    vi.spyOn(heatmapsService, "exportHeatmapPdf").mockResolvedValue({ file: pdf, fileName: "mapa-calor-skills-by-experience.pdf" });
    const user = userEvent.setup();
    await renderView();

    await user.click(screen.getByRole("button", { name: HEATMAP_TEXT.export }));
    await user.click(await screen.findByRole("menuitem", { name: /Exportar CSV/ }));
    expect(downloadFile).toHaveBeenCalledWith(expect.any(Blob), "mapa-calor-skills-by-experience.csv");

    await user.click(screen.getByRole("button", { name: HEATMAP_TEXT.export }));
    await user.click(await screen.findByRole("menuitem", { name: /Exportar PDF/ }));
    await waitFor(() => expect(downloadFile).toHaveBeenCalledWith(pdf, "mapa-calor-skills-by-experience.pdf"));
    expect(heatmapsService.exportHeatmapPdf).toHaveBeenCalledWith("skills-by-experience", expect.any(Object));
    expect(toast.success).toHaveBeenCalledWith(HEATMAP_TEXT.pdfReady, expect.anything());
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
