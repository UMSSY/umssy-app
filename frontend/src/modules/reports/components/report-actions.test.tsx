import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReportActions } from "./report-actions";

afterEach(cleanup);

function renderReportActions(hasResults = true) {
  const onExport = vi.fn();

  render(
    <ReportActions
      onExport={onExport}
      isExporting={false}
      hasResults={hasResults}
      onPeriodChange={vi.fn()}
    />,
  );

  return { onExport };
}

describe("ReportActions", () => {
  it("muestra solo las opciones PDF y CSV con sus descripciones", () => {
    renderReportActions();

    fireEvent.click(screen.getByRole("button", { name: "Descargar" }));

    expect(screen.getByText("Exportar PDF")).toBeInTheDocument();
    expect(screen.getByText("Documento formal con logos de la UMSS")).toBeInTheDocument();
    expect(screen.getByText("Exportar CSV")).toBeInTheDocument();
    expect(screen.getByText("Datos planos para análisis")).toBeInTheDocument();
    expect(screen.queryByText(/excel|orientación/i)).not.toBeInTheDocument();
  });

  it("exporta el PDF con todo el reporte filtrado por defecto", () => {
    const { onExport } = renderReportActions();

    fireEvent.click(screen.getByRole("button", { name: "Descargar" }));
    expect(screen.getByRole("menuitemradio", { name: "Todo el reporte filtrado" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByText("Exportar PDF"));

    expect(onExport).toHaveBeenCalledWith("pdf", "filtered");
  });

  it("exporta el formato elegido con el alcance de página actual", async () => {
    const user = userEvent.setup();
    const { onExport } = renderReportActions();

    fireEvent.click(screen.getByRole("button", { name: "Descargar" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Solo la página actual" }));
    fireEvent.click(screen.getByRole("button", { name: "Descargar" }));
    await user.click(screen.getByText("Exportar CSV"));

    expect(onExport).toHaveBeenCalledWith("csv", "page");
  });

  it("cierra el menú al hacer clic fuera", async () => {
    renderReportActions();

    fireEvent.click(screen.getByRole("button", { name: "Descargar" }));
    expect(screen.getByText("Exportar PDF")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    await waitFor(() => expect(screen.queryByText("Exportar PDF")).not.toBeInTheDocument());
  });

  it("deshabilita la descarga cuando no hay resultados", () => {
    renderReportActions(false);

    const button = screen.getByRole("button", { name: "Descargar" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});