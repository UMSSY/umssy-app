import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildVacancy } from "../testing/vacancy-fixtures";
import { VacancyDetailDialog } from "./vacancy-detail-dialog";

describe("VacancyDetailDialog - modalidad y ubicación", () => {
  afterEach(cleanup);

  it("abre la ubicación de Google Maps en una pestaña nueva", () => {
    render(<VacancyDetailDialog vacancy={buildVacancy({ locationUrl: "https://maps.app.goo.gl/abc123" })} onClose={vi.fn()} />);

    const link = screen.getByRole("link", { name: /Ver en el mapa/ });
    expect(link).toHaveAttribute("href", "https://maps.app.goo.gl/abc123");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it.each(["javascript:alert(1)", "https://jobs.example.invalid/seed/1", ""])(
    "oculta el enlace del mapa cuando %j no es de Google Maps",
    (locationUrl) => {
      render(<VacancyDetailDialog vacancy={buildVacancy({ locationUrl })} onClose={vi.fn()} />);

      expect(screen.queryByRole("link", { name: /Ver en el mapa/ })).toBeNull();
    },
  );

  it("muestra la modalidad de la vacante", () => {
    render(<VacancyDetailDialog vacancy={buildVacancy({ modality: "Híbrido" })} onClose={vi.fn()} />);

    expect(screen.getByText("Híbrido")).toBeInTheDocument();
  });

  it("avisa cuando la vacante no existe", () => {
    render(<VacancyDetailDialog vacancy={null} onClose={vi.fn()} />);

    expect(screen.getByText("Vacante no encontrada")).toBeInTheDocument();
  });
});
