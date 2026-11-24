import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ExportFormatTexts } from "@/shared/types/export-format-texts.types";
import { ExportFormatMenu } from "./export-format-menu";

const FORMAT_TEXTS: ExportFormatTexts = {
  pdf: { label: "Exportar PDF", description: "Documento PDF" },
  csv: { label: "Exportar CSV", description: "Datos CSV" },
};

afterEach(cleanup);

describe("ExportFormatMenu", () => {
  it("muestra las opciones PDF y CSV con los textos del consumidor", async () => {
    const user = userEvent.setup();
    render(<ExportFormatMenu triggerLabel="Exportar" formatTexts={FORMAT_TEXTS} formatHeading="Formato" onSelectFormat={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Exportar" }));

    expect(await screen.findByText("Formato")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Exportar PDF/ })).toHaveTextContent("Documento PDF");
    expect(screen.getByRole("menuitem", { name: /Exportar CSV/ })).toHaveTextContent("Datos CSV");
  });

  it("notifica el formato elegido", async () => {
    const user = userEvent.setup();
    const onSelectFormat = vi.fn();
    render(<ExportFormatMenu triggerLabel="Exportar" formatTexts={FORMAT_TEXTS} onSelectFormat={onSelectFormat} />);

    await user.click(screen.getByRole("button", { name: "Exportar" }));
    await user.click(await screen.findByRole("menuitem", { name: /Exportar CSV/ }));
    expect(onSelectFormat).toHaveBeenCalledWith("csv");

    await user.click(screen.getByRole("button", { name: "Exportar" }));
    await user.click(await screen.findByRole("menuitem", { name: /Exportar PDF/ }));
    expect(onSelectFormat).toHaveBeenLastCalledWith("pdf");
  });

  it("renderiza la sección adicional del consumidor antes de los formatos", async () => {
    const user = userEvent.setup();
    render(
      <ExportFormatMenu triggerLabel="Exportar" formatTexts={FORMAT_TEXTS} onSelectFormat={vi.fn()}>
        <p>Alcance</p>
      </ExportFormatMenu>,
    );

    await user.click(screen.getByRole("button", { name: "Exportar" }));

    expect(await screen.findByText("Alcance")).toBeInTheDocument();
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("deshabilita el disparador cuando está deshabilitado", () => {
    render(<ExportFormatMenu triggerLabel="Exportar" formatTexts={FORMAT_TEXTS} onSelectFormat={vi.fn()} disabled />);

    expect(screen.getByRole("button", { name: "Exportar" })).toBeDisabled();
  });

  it("deshabilita el disparador y lo marca ocupado mientras carga", () => {
    render(<ExportFormatMenu triggerLabel="Descargando..." formatTexts={FORMAT_TEXTS} onSelectFormat={vi.fn()} isLoading />);

    const trigger = screen.getByRole("button", { name: "Descargando..." });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute("aria-busy", "true");
  });
});
